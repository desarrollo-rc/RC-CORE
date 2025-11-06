// Web Worker para procesar imágenes en hilo separado
// Esto evita bloquear el hilo principal del navegador

interface ImageProcessingTask {
  id: string;
  url: string;
  sku: string;
}

interface ImageProcessingResult {
  id: string;
  sku: string;
  base64: string | null;
  error?: string;
  isPlaceholder?: boolean;
  url?: string;
}

// Cache local del worker
const workerCache = new Map<string, string>();

// Circuit breaker para fallos masivos
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 10;
const CIRCUIT_BREAKER_RESET_TIME = 30000; // 30 segundos
let circuitBreakerOpen = false;
let circuitBreakerOpenTime = 0;

self.onmessage = async (event: MessageEvent<ImageProcessingTask>) => {
  const { id, url, sku } = event.data;
  
  // Verificar circuit breaker
  const now = Date.now();
  if (circuitBreakerOpen && (now - circuitBreakerOpenTime) < CIRCUIT_BREAKER_RESET_TIME) {
    // Circuit breaker abierto, usar placeholder inmediatamente
    self.postMessage({
      id,
      sku,
      base64: createPlaceholderImage(sku),
      error: 'Circuit breaker open - too many failures',
      isPlaceholder: true
    } as ImageProcessingResult);
    return;
  }
  
  // Reset circuit breaker si ha pasado el tiempo
  if (circuitBreakerOpen && (now - circuitBreakerOpenTime) >= CIRCUIT_BREAKER_RESET_TIME) {
    circuitBreakerOpen = false;
    consecutiveFailures = 0;
  }
  
  try {
    // Verificar cache del worker
    if (workerCache.has(url)) {
      self.postMessage({
        id,
        sku,
        base64: workerCache.get(url)!
      } as ImageProcessingResult);
      return;
    }

    // Sistema de retry con timeouts más generosos
    // El backend necesita tiempo para consultar BD y hacer request externa
    let base64: string | null = null;
    let lastError: string = '';
    
    const timeouts = [5000, 8000, 12000]; // Timeouts más generosos: 5s, 8s, 12s
    
    for (let attempt = 0; attempt < timeouts.length; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeouts[attempt]);

        const response = await fetch(url, {
          signal: controller.signal,
          mode: 'cors',
          cache: attempt === 0 ? 'force-cache' : 'no-cache', // En retry, no usar cache
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'max-age=3600'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        
        // Verificar que el blob no esté vacío
        if (blob.size === 0) {
          throw new Error('Empty image blob');
        }
        
        // Convertir a Base64
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Verificar que el Base64 no esté corrupto y sea una imagen real
            if (result && result.length > 1000 && !result.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ')) {
              // Verificar que no sea una página de error (contiene HTML)
              if (!result.includes('<html') && !result.includes('<!DOCTYPE')) {
                resolve(result);
              } else {
                reject(new Error('Received HTML instead of image'));
              }
            } else {
              reject(new Error('Invalid or placeholder image data'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Si llegamos aquí, la imagen se cargó correctamente
        break;
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Si es el último intento, fallar
        if (attempt === timeouts.length - 1) {
          throw new Error(`Failed after ${timeouts.length} attempts: ${lastError}`);
        }
        
        // Esperar poco tiempo antes del siguiente intento
        const waitTime = 300 * (attempt + 1); // 300ms, 600ms, 900ms entre retries
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (base64) {
      // Éxito: reset circuit breaker
      consecutiveFailures = 0;
      circuitBreakerOpen = false;
      
      // Cachear en el worker solo si se cargó correctamente
      workerCache.set(url, base64);
      
      self.postMessage({
        id,
        sku,
        base64,
        url: url
      } as ImageProcessingResult);
    } else {
      throw new Error(`All retry attempts failed: ${lastError}`);
    }

  } catch (error) {
    // Incrementar fallos consecutivos
    consecutiveFailures++;
    
    // Activar circuit breaker si hay muchos fallos
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      circuitBreakerOpen = true;
      circuitBreakerOpenTime = Date.now();
      console.warn(`🚨 Circuit breaker activated after ${consecutiveFailures} consecutive failures`);
    }
    
    // Crear imagen placeholder como fallback
    const placeholder = createPlaceholderImage(sku);
    
      self.postMessage({
        id,
        sku,
        base64: placeholder,
        error: error instanceof Error ? error.message : 'Unknown error',
        isPlaceholder: true,
        url: url
      } as ImageProcessingResult);
  }
};

// Función para crear imagen placeholder (compatible con Web Workers)
function createPlaceholderImage(_sku: string): string {
  // Crear un PNG simple de 200x200 con fondo gris
  // Esto es más eficiente que usar canvas en Web Workers
  const width = 200;
  const height = 200;
  
  // Crear un PNG base64 simple con fondo gris
  // PNG header + simple gray rectangle
  const pngData = createSimpleGrayPNG(width, height);
  
  return `data:image/png;base64,${pngData}`;
}

// Crear un PNG simple gris sin usar canvas
function createSimpleGrayPNG(_width: number, _height: number): string {
  // PNG simple de 1x1 pixel gris, escalado
  const grayPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return grayPixel;
}

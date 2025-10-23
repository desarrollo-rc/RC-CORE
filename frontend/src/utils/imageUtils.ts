// frontend/src/utils/imageUtils.ts

// Cache compartido para almacenar imágenes Base64 ya convertidas
const globalImageBase64Cache = new Map<string, string>();

// Session HTTP reutilizable para connection pooling
const httpSession = new Map<string, any>();

/**
 * Convierte una URL de imagen a Base64
 * @param imageUrl - URL de la imagen (puede ser relativa o absoluta)
 * @returns Promise<string> - Base64 de la imagen
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    // Si es una URL relativa, construir la URL absoluta
    let finalUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';
      finalUrl = `${baseUrl}${imageUrl}`;
    }
    
    // Verificar si ya existe en cache
    if (globalImageBase64Cache.has(finalUrl)) {
      console.log(`📦 Using cached image: ${finalUrl}`);
      return globalImageBase64Cache.get(finalUrl)!;
    }
    
        const response = await fetch(finalUrl, {
          mode: 'cors',
          cache: 'force-cache', // Usar cache del navegador
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'max-age=3600'
          }
        });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let base64 = reader.result as string;
        
        // Comprimir imagen para Excel (más rápido)
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Redimensionar a máximo 200x200 para Excel
            const maxSize = 200;
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprimir con calidad 0.7 (más rápido)
            base64 = canvas.toDataURL('image/jpeg', 0.7);
          }
          
          // Guardar en cache antes de resolver
          globalImageBase64Cache.set(finalUrl, base64);
          console.log(`✅ Cached compressed image: ${finalUrl}`);
          resolve(base64);
        };
        img.src = base64;
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Convierte un archivo a Base64
 * @param file - Archivo de imagen
 * @returns Promise<string> - Base64 del archivo
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona una imagen Base64
 * @param base64 - Base64 de la imagen
 * @param maxWidth - Ancho máximo
 * @param maxHeight - Alto máximo
 * @returns Promise<string> - Base64 redimensionado
 */
export async function resizeBase64Image(
  base64: string, 
  maxWidth: number = 100, 
  maxHeight: number = 100
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(base64);
        return;
      }
      
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(resizedBase64);
    };
    img.src = base64;
  });
}

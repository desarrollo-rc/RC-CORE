// frontend/src/utils/imageUtils.ts

/**
 * Convierte una URL de imagen a Base64
 * @param imageUrl - URL de la imagen
 * @returns Promise<string> - Base64 de la imagen
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo imagen a Base64:', error);
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

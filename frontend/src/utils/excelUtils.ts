// frontend/src/utils/excelUtils.ts
import ExcelJS from 'exceljs';
import type { CotizacionData } from '../features/compras/types';

/**
 * Exporta una cotización a Excel con imágenes incrustadas
 * @param cotizacionData - Datos de la cotización (con imágenes ya en Base64)
 * @param nombreArchivo - Nombre del archivo a exportar
 * @returns Promise<void>
 */
export async function exportarCotizacionConImagenes(
  cotizacionData: CotizacionData,
  nombreArchivo: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Cotización');

  // Configurar columnas
  worksheet.columns = [
    { header: 'Número de artículo', key: 'numero_articulo', width: 15 },
    { header: 'Descripción del artículo', key: 'descripcion_articulo', width: 25 },
    { header: 'Nombre extranjero', key: 'nombre_extranjero', width: 20 },
    { header: 'Nombre en Chino', key: 'nombre_chino', width: 20 },
    { header: 'Marca', key: 'marca', width: 15 },
    { header: 'Modelo', key: 'modelo', width: 15 },
    { header: 'Modelo en Chino', key: 'modelo_chino', width: 20 },
    { header: 'Volumen - Unidad de compra', key: 'volumen_unidad_compra', width: 15 },
    { header: 'OEM Part', key: 'oem_part', width: 15 },
    { header: 'Pedido', key: 'pedido', width: 10 },
    { header: 'FOB', key: 'fob', width: 12 },
    { header: 'Last FOB', key: 'last_fob', width: 12 },
    { header: 'Imagen 1', key: 'imagen_1', width: 18 },
    { header: 'Imagen 2', key: 'imagen_2', width: 18 },
    { header: 'Imagen 3', key: 'imagen_3', width: 18 },
    { header: 'Imagen 4', key: 'imagen_4', width: 18 },
    { header: 'Imagen 5', key: 'imagen_5', width: 18 }
  ];

  // Estilo para los headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Agregar datos y procesar imágenes
  for (let i = 0; i < cotizacionData.items.length; i++) {
    const item = cotizacionData.items[i];
    const rowNumber = i + 2; // +2 porque la primera fila es header

    // Agregar fila con datos (sin imágenes por ahora)
    const row = worksheet.addRow({
      numero_articulo: item.numero_articulo,
      descripcion_articulo: item.descripcion_articulo,
      nombre_extranjero: item.nombre_extranjero,
      nombre_chino: item.nombre_chino,
      marca: item.marca,
      modelo: item.modelo,
      modelo_chino: item.modelo_chino,
      volumen_unidad_compra: item.volumen_unidad_compra,
      oem_part: item.oem_part,
      pedido: item.pedido,
      fob: item.fob,
      last_fob: item.last_fob
    });

    // Configurar altura de fila para acomodar imágenes
    row.height = 46;

    // Procesar imágenes en columnas separadas (hasta 5)
    if (item.imagenes && item.imagenes.length > 0) {
      for (let imgIndex = 0; imgIndex < Math.min(item.imagenes.length, 5); imgIndex++) {
        try {
          const imagen = item.imagenes[imgIndex];
          
          // Las imágenes DEBEN estar en Base64 ya (convertidas durante preview)
          // Si es un string que empieza con 'data:image/', es Base64
          if (imagen && imagen.startsWith('data:image/')) {
            const base64Data = imagen.split(',')[1]; // Remover el prefijo data:image/...
            
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: imagen.includes('image/png') ? 'png' : 'jpeg'
            });

            // Calcular columna para cada imagen (columnas M, N, O, P, Q - índices 12, 13, 14, 15, 16)
            const imageCol = 12 + imgIndex; // 12, 13, 14, 15, 16
            
            // Agregar imagen a su columna correspondiente (misma fila que los datos)
            worksheet.addImage(imageId, {
              tl: { col: imageCol, row: rowNumber - 1 },
              ext: { width: 110, height: 60 }, // Proporción optimizada para columnas de 18
              editAs: 'oneCell'
            });
          }
        } catch (error) {
          // Silently skip images that fail to process
        }
      }
    }
  }

  // Aplicar bordes a todas las celdas
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Guardar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Crear enlace de descarga
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nombreArchivo}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

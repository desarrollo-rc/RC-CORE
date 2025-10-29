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

  // Generar columnas dinámicamente basadas en los datos
  const generateColumns = (items: any[], originalHeaders?: string[]) => {
    if (!items || items.length === 0) return [];

    const firstItem = items[0];
    const columns = [];

    // Si tenemos headers originales, usarlos para mantener el orden
    if (originalHeaders && originalHeaders.length > 0) {
      originalHeaders.forEach((header, index) => {
        if (index === 0) {
          // Primera columna siempre es SKU
          columns.push({
            header: 'SKU',
            key: 'numero_articulo',
            width: 15
          });
        } else if (index === 1) {
          // Segunda columna siempre es Descripción
          columns.push({
            header: 'Descripción',
            key: 'descripcion_articulo',
            width: 25
          });
        } else {
          // Buscar la propiedad correspondiente en el item
          const headerLower = header.toLowerCase();
          let key = '';
          let headerName = header;

          // Mapear headers conocidos a propiedades del item
          if (headerLower.includes('pedido') || headerLower.includes('cantidad') || headerLower.includes('qty') || headerLower.includes('order')) {
            key = 'pedido';
          } else if (headerLower.includes('fob') && !headerLower.includes('last')) {
            key = 'fob';
          } else if (headerLower.includes('nombre') && headerLower.includes('extranjero')) {
            key = 'nombre_extranjero';
          } else if (headerLower.includes('nombre') && headerLower.includes('chino')) {
            key = 'nombre_chino';
          } else if (headerLower.includes('marca')) {
            key = 'marca';
          } else if (headerLower.includes('modelo') && !headerLower.includes('chino')) {
            key = 'modelo';
          } else if (headerLower.includes('modelo') && headerLower.includes('chino')) {
            key = 'modelo_chino';
          } else if (headerLower.includes('volumen') || headerLower.includes('vol')) {
            key = 'volumen_unidad_compra';
          } else if (headerLower.includes('oem')) {
            key = 'oem_part';
          } else if (headerLower.includes('last') && headerLower.includes('fob')) {
            key = 'last_fob';
          } else if (headerLower.includes('cod') && headerLower.includes('mod')) {
            key = 'cod_mod';
          } else if (headerLower.includes('tg')) {
            key = 'tg';
          } else if (headerLower.includes('com') && headerLower.includes('técnico')) {
            key = 'com_tecnico';
          } else if (headerLower.includes('error')) {
            key = 'errores';
          } else if (headerLower.includes('supplier') || headerLower.includes('proveedor')) {
            key = 'supplier';
          } else {
            // Para columnas no reconocidas, usar el nombre original
            key = `columna_${index + 1}`;
          }

          // Verificar si la propiedad existe en el item
          if (key && (firstItem as any)[key] !== undefined) {
            columns.push({
              header: headerName,
              key,
              width: key.includes('descripcion') || key.includes('nombre') ? 25 : 15
            });
          } else {
            // Si no se encuentra la propiedad, crear una columna genérica
            columns.push({
              header: headerName,
              key: `columna_${index + 1}`,
              width: 15
            });
          }
        }
      });
    } else {
      // Fallback: usar el método anterior si no hay headers originales
      columns.push(
        { header: 'SKU', key: 'numero_articulo', width: 15 },
        { header: 'Descripción', key: 'descripcion_articulo', width: 25 }
      );

      Object.keys(firstItem).forEach(key => {
        if (key !== 'numero_articulo' && key !== 'descripcion_articulo' && 
            key !== 'imagenes' && key !== 'subtotal' && key !== 'observaciones') {
          
          let header = key;
          if (key === 'nombre_extranjero') header = 'Nombre Extranjero';
          else if (key === 'nombre_chino') header = 'Nombre Chino';
          else if (key === 'volumen_unidad_compra') header = 'Volumen';
          else if (key === 'oem_part') header = 'OEM Part';
          else if (key === 'last_fob') header = 'Last FOB';
          else if (key === 'cod_mod') header = 'Cod Mod';
          else if (key === 'com_tecnico') header = 'Com Técnico';
          else if (key === 'volumen_dealer') header = 'Volumen Dealer';
          else if (key.startsWith('columna_')) {
            const colNum = key.replace('columna_', '');
            header = `Columna ${colNum}`;
          } else {
            header = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          }

          columns.push({
            header,
            key,
            width: key.includes('descripcion') || key.includes('nombre') ? 25 : 15
          });
        }
      });
    }

    // Agregar columnas de imágenes al final
    const imageLimit = items.length <= 500 ? 5 : 3;
    for (let i = 1; i <= imageLimit; i++) {
      columns.push({
        header: `Imagen ${i}`,
        key: `imagen_${i}`,
        width: 18
      });
    }

    return columns;
  };

  // Configurar columnas dinámicamente
  worksheet.columns = generateColumns(cotizacionData.items, cotizacionData.originalHeaders);

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

    // Crear objeto de datos dinámico
    const rowData: any = {
      numero_articulo: item.numero_articulo,
      descripcion_articulo: item.descripcion_articulo
    };

    // Agregar todas las propiedades dinámicas del item
    Object.keys(item).forEach(key => {
      if (key !== 'numero_articulo' && key !== 'descripcion_articulo' && 
          key !== 'imagenes' && key !== 'subtotal' && key !== 'observaciones') {
        rowData[key] = (item as any)[key];
      }
    });

    // Agregar fila con datos dinámicos
    const row = worksheet.addRow(rowData);

    // Configurar altura de fila para acomodar imágenes
    row.height = 46;

    // Procesar imágenes en columnas separadas
    const imageLimit = cotizacionData.items.length <= 500 ? 5 : 3;
    if (item.imagenes && item.imagenes.length > 0) {
      for (let imgIndex = 0; imgIndex < Math.min(item.imagenes.length, imageLimit); imgIndex++) {
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

            // Calcular columna para cada imagen (después de todas las columnas de datos)
            const dataColumnsCount = generateColumns(cotizacionData.items, cotizacionData.originalHeaders).length - imageLimit;
            const imageCol = dataColumnsCount + imgIndex;
            
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

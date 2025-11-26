// frontend/src/utils/excelUtils.ts
import ExcelJS from 'exceljs';
import type { CotizacionData } from '../features/compras/types';

/**
 * Función helper robusta para mapear nombres de columnas a keys de propiedades
 * Usa patrones específicos y prioriza coincidencias exactas para evitar conflictos
 * @param header - Nombre de la columna (normalizado a minúsculas)
 * @returns key correspondiente o null si no se encuentra
 */
function mapHeaderToKey(header: string): string | null {
  const headerLower = header.toLowerCase().trim();
  
  // Patrones específicos (ordenados de más específico a menos específico)
  // Usar expresiones regulares para patrones más complejos
  
  // 1. Coincidencias exactas o muy específicas primero
  if (/^cod\s*mod|^código\s*modelo|codigo\s*modelo/i.test(headerLower)) {
    return 'cod_mod';
  }
  
  // 2. Patrones con múltiples palabras (más específicos)
  if (/nombre.*extranjero|nombre.*foreign|foreign.*name/i.test(headerLower)) {
    return 'nombre_extranjero';
  }
  if (/nombre.*chino|nombre.*chinese|chinese.*name/i.test(headerLower)) {
    return 'nombre_chino';
  }
  if (/modelo.*chino|modelo.*chinese|chinese.*model/i.test(headerLower)) {
    return 'modelo_chino';
  }
  if (/volumen.*total|total.*volumen|total.*volume/i.test(headerLower)) {
    return 'volumen_total';
  }
  if (/volumen.*dealer|dealer.*volumen|dealer.*volume/i.test(headerLower)) {
    return 'volumen_dealer';
  }
  if (/volumen.*(compra|unidad)|volume.*(compra|unidad)|(compra|unidad).*volumen/i.test(headerLower)) {
    return 'volumen_unidad_compra';
  }
  if (/last.*fob|fob.*last|último.*fob/i.test(headerLower)) {
    return 'last_fob';
  }
  if (/com.*técnico|com.*tecnico|technical.*comment|comentario.*técnico/i.test(headerLower)) {
    return 'com_tecnico';
  }
  
  // 3. Patrones simples pero verificando que no sean parte de palabras más complejas
  // Verificar "modelo" pero asegurarse de que no sea parte de "cod modelo" o "modelo chino"
  if (/^modelo$|^model$/.test(headerLower) || 
      (/modelo/.test(headerLower) && !/cod.*modelo|modelo.*chino|código.*modelo/i.test(headerLower))) {
    return 'modelo';
  }
  
  // 4. Patrones simples
  if (/^marca$|^brand$/i.test(headerLower) || 
      (/marca|brand/.test(headerLower) && !/cod.*marca|código.*marca/i.test(headerLower))) {
    return 'marca';
  }
  if (/^oem|oem.*part/i.test(headerLower)) {
    return 'oem_part';
  }
  if (/^tg$|^tg\s/i.test(headerLower)) {
    return 'tg';
  }
  if (/^error|errores/i.test(headerLower)) {
    return 'errores';
  }
  if (/^supplier|proveedor/i.test(headerLower)) {
    return 'supplier';
  }
  if (/^pedido|cantidad|qty|order/i.test(headerLower)) {
    return 'pedido';
  }
  if (/^fob|precio|price|cost/i.test(headerLower) && !/last.*fob/i.test(headerLower)) {
    return 'fob';
  }
  if (/^volumen|^vol\s|^volume/i.test(headerLower) && 
      !/total|dealer|compra|unidad/i.test(headerLower)) {
    return 'volumen_unidad_compra';
  }
  
  return null;
}

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
      const usedKeys = new Set<string>(); // Rastrear keys ya usadas para evitar duplicados
      
      originalHeaders.forEach((header, index) => {
        if (index === 0) {
          // Primera columna siempre es SKU
          columns.push({
            header: 'SKU',
            key: 'numero_articulo',
            width: 15
          });
          usedKeys.add('numero_articulo');
        } else if (index === 1) {
          // Segunda columna siempre es Descripción
          columns.push({
            header: 'Descripción',
            key: 'descripcion_articulo',
            width: 25
          });
          usedKeys.add('descripcion_articulo');
        } else {
          // Buscar la propiedad correspondiente en el item usando la función helper robusta
          let key = mapHeaderToKey(header);
          let headerName = header;

          // Si no se encontró un mapeo, intentar buscar una propiedad que coincida
          if (!key) {
            const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
            if ((firstItem as any)[normalizedHeader] !== undefined && !usedKeys.has(normalizedHeader)) {
              key = normalizedHeader;
            } else {
              // Si no se encuentra, usar el nombre de columna basado en el índice
              key = `columna_${index + 1}`;
            }
          }

          // Si la key ya fue usada, buscar una alternativa
          if (usedKeys.has(key)) {
            // Intentar buscar columna_X primero
            const columnaKey = `columna_${index + 1}`;
            if ((firstItem as any)[columnaKey] !== undefined && !usedKeys.has(columnaKey)) {
              key = columnaKey;
            } else {
              // Si no, usar una key única basada en el índice
              key = `columna_${index + 1}`;
            }
          }

          // Verificar si la propiedad existe en el item
          if (key && (firstItem as any)[key] !== undefined) {
            columns.push({
              header: headerName,
              key,
              width: key.includes('descripcion') || key.includes('nombre') ? 25 : 15
            });
            usedKeys.add(key);
          } else {
            // Si no se encuentra la propiedad, buscar si existe como columna_X
            const columnaKey = `columna_${index + 1}`;
            if ((firstItem as any)[columnaKey] !== undefined && !usedKeys.has(columnaKey)) {
              columns.push({
                header: headerName,
                key: columnaKey,
                width: 15
              });
              usedKeys.add(columnaKey);
            } else {
              // Si no se encuentra con el índice exacto, buscar cualquier propiedad columna_ no usada
              let foundKey = '';
              Object.keys(firstItem).forEach(itemKey => {
                if (itemKey.startsWith('columna_') && !usedKeys.has(itemKey) && !foundKey) {
                  // Verificar si el valor no está vacío
                  const value = (firstItem as any)[itemKey];
                  if (value !== undefined && value !== null && value !== '') {
                    foundKey = itemKey;
                  }
                }
              });
              
              if (foundKey) {
                columns.push({
                  header: headerName,
                  key: foundKey,
                  width: 15
                });
                usedKeys.add(foundKey);
              } else {
                // Si no se encuentra ninguna, crear una columna genérica
                // Asegurar que la key sea única
                let uniqueKey = `columna_${index + 1}`;
                let counter = 1;
                while (usedKeys.has(uniqueKey)) {
                  uniqueKey = `columna_${index + 1}_${counter}`;
                  counter++;
                }
                columns.push({
                  header: headerName,
                  key: uniqueKey,
                  width: 15
                });
                usedKeys.add(uniqueKey);
              }
            }
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
          else if (key === 'volumen_unidad_compra') header = 'Volumen Compra';
          else if (key === 'volumen_total') header = 'Volumen Total';
          else if (key === 'volumen_dealer') header = 'Volumen Dealer';
          else if (key === 'oem_part') header = 'OEM Part';
          else if (key === 'last_fob') header = 'Last FOB';
          else if (key === 'cod_mod') header = 'Cod Mod';
          else if (key === 'com_tecnico') header = 'Com Técnico';
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

  // Obtener todas las columnas definidas
  const definedColumns = generateColumns(cotizacionData.items, cotizacionData.originalHeaders);
  
  // Configurar columnas dinámicamente
  worksheet.columns = definedColumns;

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

    // Crear objeto de datos dinámico, inicializando con todas las columnas definidas
    const rowData: any = {
      numero_articulo: item.numero_articulo || '',
      descripcion_articulo: item.descripcion_articulo || ''
    };

    // Primero, agregar todas las propiedades del item
    Object.keys(item).forEach(key => {
      if (key !== 'numero_articulo' && key !== 'descripcion_articulo' && 
          key !== 'imagenes' && key !== 'subtotal' && key !== 'observaciones') {
        rowData[key] = (item as any)[key];
      }
    });

    // Asegurar que todas las columnas definidas tengan un valor (incluso si es vacío)
    definedColumns.forEach(column => {
      if (column.key !== 'numero_articulo' && column.key !== 'descripcion_articulo' && 
          !column.key.startsWith('imagen_')) {
        if (rowData[column.key] === undefined) {
          // Si la columna no tiene valor, intentar buscar en el item con diferentes variaciones
          const itemValue = (item as any)[column.key];
          if (itemValue !== undefined) {
            rowData[column.key] = itemValue;
          } else {
            // Si no se encuentra, dejar como cadena vacía
            rowData[column.key] = '';
          }
        }
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
            const dataColumnsCount = definedColumns.length - imageLimit;
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

// frontend/src/features/compras/pages/CotizadorPage.tsx
import { useState, useCallback } from 'react';
import {
  Box,
  Title,
  Paper,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Table,
  Badge,
  TextInput,
  Textarea,
  Divider,
  Center,
  Loader,
  Modal,
  Progress,
  Grid,
  Card
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconTrash,
  IconRefresh,
  IconX
} from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import type { CotizacionData, CotizacionItem } from '../types';
import { ProductImage } from '../components';
import { exportarCotizacionConImagenes } from '../../../utils';
import { fetchImageMap } from '../services/comprasService';
import { useEffect } from 'react';

export function CotizadorPage() {
  const [cotizacionData, setCotizacionData] = useState<CotizacionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [nombreCotizacion, setNombreCotizacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loadingImages, setLoadingImages] = useState(false);
  // Eliminamos el estado de tipoCliente ya que ahora será automático
  const [reloadingProducts, setReloadingProducts] = useState<Set<string>>(new Set());

  // Función helper para determinar el límite de imágenes basado en la cantidad de SKUs
  const getImageLimit = (skuCount: number): number => {
    return skuCount <= 500 ? 5 : 3;
  };

  /**
   * Función helper robusta para mapear nombres de columnas a keys de propiedades
   * Usa patrones específicos y prioriza coincidencias exactas para evitar conflictos
   * @param header - Nombre de la columna (normalizado a minúsculas)
   * @returns key correspondiente o null si no se encuentra
   */
  const mapHeaderToKey = (header: string): string | null => {
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
  };

  // Función helper para generar las columnas de la tabla dinámicamente
  const generateTableColumns = (items: CotizacionItem[], originalHeaders?: string[]) => {
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
            key: 'numero_articulo',
            label: 'SKU',
            width: '100px'
          });
          usedKeys.add('numero_articulo');
        } else if (index === 1) {
          // Segunda columna siempre es Descripción
          columns.push({
            key: 'descripcion_articulo',
            label: 'Descripción',
            width: '150px'
          });
          usedKeys.add('descripcion_articulo');
        } else {
          // Buscar la propiedad correspondiente en el item usando la función helper robusta
          let key = mapHeaderToKey(header) || `columna_${index + 1}`;
          let label = header;

          // Si la key ya fue usada, usar una key única basada en el índice
          if (usedKeys.has(key)) {
            key = `columna_${index + 1}`;
          }

          // Verificar si la propiedad existe en el item
          if (key && (firstItem as any)[key] !== undefined) {
            columns.push({
              key,
              label,
              width: key.includes('descripcion') || key.includes('nombre') ? '150px' : '120px'
            });
            usedKeys.add(key);
          } else {
            // Si no se encuentra la propiedad, crear una columna genérica
            // Asegurar que la key sea única
            let uniqueKey = `columna_${index + 1}`;
            let counter = 1;
            while (usedKeys.has(uniqueKey)) {
              uniqueKey = `columna_${index + 1}_${counter}`;
              counter++;
            }
            columns.push({
              key: uniqueKey,
              label,
              width: '120px'
            });
            usedKeys.add(uniqueKey);
          }
        }
      });
    } else {
      // Fallback: usar el método anterior si no hay headers originales
      columns.push(
        { key: 'numero_articulo', label: 'SKU', width: '100px' },
        { key: 'descripcion_articulo', label: 'Descripción', width: '150px' }
      );

      Object.keys(firstItem).forEach(key => {
        if (key !== 'numero_articulo' && key !== 'descripcion_articulo' && 
            key !== 'imagenes' && key !== 'subtotal' && key !== 'observaciones') {
          
          let label = key;
          if (key === 'nombre_extranjero') label = 'Nombre Extranjero';
          else if (key === 'nombre_chino') label = 'Nombre Chino';
          else if (key === 'volumen_unidad_compra') label = 'Volumen Compra';
          else if (key === 'volumen_total') label = 'Volumen Total';
          else if (key === 'volumen_dealer') label = 'Volumen Dealer';
          else if (key === 'oem_part') label = 'OEM Part';
          else if (key === 'last_fob') label = 'Last FOB';
          else if (key === 'cod_mod') label = 'Cod Mod';
          else if (key === 'com_tecnico') label = 'Com Técnico';
          else if (key.startsWith('columna_')) {
            const colNum = key.replace('columna_', '');
            label = `Columna ${colNum}`;
          } else {
            label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          }

          columns.push({
            key,
            label,
            width: key.includes('descripcion') || key.includes('nombre') ? '150px' : '120px'
          });
        }
      });
    }

    // Agregar columnas de imágenes al final
    const imageLimit = getImageLimit(items.length);
    for (let i = 1; i <= imageLimit; i++) {
      columns.push({
        key: `imagen_${i}`,
        label: `Imagen ${i}`,
        width: '200px'
      });
    }

    return columns;
  };
  
  // Estados para procesamiento por lotes
  const [, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    currentBatchProgress: 0,
    totalProcessed: 0,
    totalImages: 0,
    successfulImages: 0,
    failedImages: 0,
    currentBatchImages: 0,
    currentBatchSuccessful: 0,
    currentBatchFailed: 0
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [batchHistory, setBatchHistory] = useState<Array<{
    batchNumber: number;
    totalProducts: number;
    totalImages: number;
    successfulImages: number;
    failedImages: number;
    successRate: number;
    processingTime: number;
    status: 'completed' | 'failed' | 'processing';
    failedSkus?: string[]; // SKUs que tuvieron errores en este batch
  }>>([]);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  
  // Estado para acumular errores durante el procesamiento
  const [errorLogs, setErrorLogs] = useState<Array<{
    timestamp: string;
    batchNumber?: number;
    sku?: string;
    id?: string;
    error: string;
    errorType: string;
    url?: string;
  }>>([]);

  const reloadBatch = async (batchNumber: number) => {
    if (!cotizacionData) return;
    
    // Obtener el batch del historial para ver qué SKUs tuvieron errores
    const batchInfo = batchHistory.find(b => b.batchNumber === batchNumber);
    
    if (!batchInfo) {
      console.warn(`⚠️ No se encontró información del batch ${batchNumber}`);
      return;
    }
    
    // Si hay SKUs con errores registrados, solo recargar esos
    // Si no, recargar todo el batch
    let itemsToReload: CotizacionItem[];
    
    if (batchInfo.failedSkus && batchInfo.failedSkus.length > 0) {
      // Solo recargar SKUs que tuvieron errores
      const BATCH_SIZE = 100;
      const startIndex = (batchNumber - 1) * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, cotizacionData.items.length);
      const allBatchItems = cotizacionData.items.slice(startIndex, endIndex);
      
      // Filtrar solo los items con SKUs que tuvieron errores
      itemsToReload = allBatchItems.filter(item => 
        batchInfo.failedSkus!.includes(item.numero_articulo)
      );
      
      console.log(`🔄 Reloading batch ${batchNumber}: ${itemsToReload.length} SKUs con errores (de ${allBatchItems.length} total)`);
      console.log(`📋 SKUs a recargar:`, itemsToReload.map(item => item.numero_articulo).slice(0, 10), 
        itemsToReload.length > 10 ? `... y ${itemsToReload.length - 10} más` : '');
    } else {
      // No hay SKUs específicos registrados, recargar todo el batch
      const BATCH_SIZE = 100;
      const startIndex = (batchNumber - 1) * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, cotizacionData.items.length);
      itemsToReload = cotizacionData.items.slice(startIndex, endIndex);
      
      console.log(`🔄 Reloading batch ${batchNumber} completo: ${itemsToReload.length} products`);
    }
    
    if (itemsToReload.length === 0) {
      console.warn(`⚠️ No hay items para recargar en el batch ${batchNumber}`);
      return;
    }
    
    // Marcar lote como procesando
    setBatchHistory(prev => prev.map(batch => 
      batch.batchNumber === batchNumber 
        ? { ...batch, status: 'processing' as const }
        : batch
    ));
    
    // Usar estrategia optimizada para recarga
    const BATCH_SIZE = 100;
    await processBatchOptimized(itemsToReload, batchNumber, Math.ceil(cotizacionData.items.length / BATCH_SIZE));
  };

  const processBatchOptimized = async (batchItems: CotizacionItem[], batchNumber: number, totalBatches: number) => {
    const startTime = performance.now();
    console.log(`🚀 Optimized reload for batch ${batchNumber}/${totalBatches} (${batchItems.length} products)...`);
    
    try {
      const skus = batchItems.map((item) => item.numero_articulo);
      const imageMap = await fetchImageMap(skus);
      
      const fetchTime = performance.now();
      console.log(`📥 Image URLs fetched for batch ${batchNumber} in ${(fetchTime - startTime).toFixed(2)}ms`);

      const imageMapBase64: Record<string, string[]> = {};
      const imageLimit = getImageLimit(cotizacionData?.items.length || 0);
      console.log(`📊 Image limit for ${cotizacionData?.items.length || 0} SKUs: ${imageLimit} images per SKU`);
      
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => {
        // Asegurar que el SKU no tenga el sufijo _index (en caso de que el backend lo haya agregado por error)
        let cleanSku = sku;
        
        // Limpiar el SKU si tiene el patrón _número
        const match = sku.match(/^(.+)_(\d+)$/);
        if (match) {
          const [, baseSku, indexStr] = match;
          const index = parseInt(indexStr);
          // Si el índice está en el rango válido (0-9), probablemente es un sufijo agregado por error
          if (index >= 0 && index < 10) {
            cleanSku = baseSku;
          }
        }
        
        // También limpiar las URLs si contienen el SKU con sufijo
        const cleanedUrls = urls.map(url => {
          // Si la URL contiene el SKU con sufijo, reemplazarlo con el SKU limpio
          if (sku !== cleanSku && url.includes(`/${sku}/`)) {
            return url.replace(`/${sku}/`, `/${cleanSku}/`);
          }
          return url;
        });
        
        return cleanedUrls.slice(0, imageLimit).map((url, index) => ({ 
          sku: cleanSku, // Usar el SKU limpio
          url, 
          id: `${cleanSku}_${index}` // El id también debe usar el SKU limpio
        }));
      });
      
      console.log(`🔄 Converting ${allImageUrls.length} images for batch ${batchNumber} with optimized settings...`);
      
      // Configuración optimizada para recarga
      const workerCount = 1;
      const workers: Worker[] = [];
      const workerResults = new Map<string, { sku: string; base64: string | null }>();
      let completedTasks = 0;
      
      // Crear workers con configuración optimizada
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(new URL('../../../workers/imageWorker.ts', import.meta.url), { type: 'module' });
        workers.push(worker);
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean; url?: string }>) => {
          const { id, sku, base64, error, isPlaceholder, url } = event.data;
          
          if (error && isPlaceholder) {
            console.warn(`🔄 Using placeholder for ${id}: ${error}`);
            setErrorLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              batchNumber,
              sku,
              id,
              error,
              errorType: 'Placeholder',
              url: url || 'N/A'
            }]);
          } else if (error && !isPlaceholder) {
            setErrorLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              batchNumber,
              sku,
              id,
              error,
              errorType: 'Error',
              url: url || 'N/A'
            }]);
          }
          
          workerResults.set(id, { sku, base64 });
          completedTasks++;
          
          // Actualizar progreso
          const currentProgress = (completedTasks / allImageUrls.length * 100).toFixed(1);
          setBatchProgress(prev => ({
            ...prev,
            currentBatchProgress: parseFloat(currentProgress)
          }));
        };
      }
      
      // Distribución más agresiva para recarga
      const batchSize = 8; // Más imágenes por vez
      for (let i = 0; i < allImageUrls.length; i += batchSize) {
        const batch = allImageUrls.slice(i, i + batchSize);
        
        batch.forEach((task, batchIndex) => {
          const workerIndex = (i + batchIndex) % workerCount;
          workers[workerIndex].postMessage(task);
        });
        
        // Pausa mínima para recarga
        if (i + batchSize < allImageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 25)); // 25ms entre batches
        }
      }
      
      // Esperar completación
      await new Promise<void>((resolve) => {
        const checkCompletion = () => {
          if (completedTasks === allImageUrls.length) {
            resolve();
          } else {
            setTimeout(checkCompletion, 50);
          }
        };
        checkCompletion();
      });
      
      workers.forEach(worker => worker.terminate());
      
      // Procesar resultados
      // Nota: workerResults es un Map donde la clave es el id (ej: "F5016_1") y el valor es { sku, base64 }
      workerResults.forEach((result) => {
        const { sku, base64 } = result;
        // Asegurar que el SKU no tenga el sufijo _index (si el worker por alguna razón devolvió el id como sku)
        // Solo limpiamos si el SKU termina en _número y ese número es un índice válido (0 hasta imageLimit-1)
        let cleanSku = sku;
        const match = sku.match(/^(.+)_(\d+)$/);
        if (match) {
          const [, baseSku, indexStr] = match;
          const index = parseInt(indexStr);
          // Si el índice está dentro del rango válido de imágenes (0 a imageLimit-1), probablemente es un sufijo agregado por error
          // Si es mayor, podría ser parte del SKU legítimo
          if (index >= 0 && index < imageLimit) {
            cleanSku = baseSku;
            // Log solo si detectamos una corrección
            if (cleanSku !== sku) {
              console.warn(`⚠️ SKU limpiado: "${sku}" -> "${cleanSku}" (índice ${index} detectado como sufijo)`);
            }
          }
        }
        if (base64) {
          if (!imageMapBase64[cleanSku]) {
            imageMapBase64[cleanSku] = [];
          }
          imageMapBase64[cleanSku].push(base64);
        }
      });

      const conversionTime = performance.now();
      console.log(`🔄 Optimized conversion completed for batch ${batchNumber} in ${(conversionTime - fetchTime).toFixed(2)}ms`);

      // Calcular estadísticas
      const totalImages = allImageUrls.length;
      const successfulImages = Array.from(workerResults.values()).filter(result => {
        if (!result.base64) return false;
        const isPlaceholder = result.base64.includes('No Image') || 
                             result.base64.length < 1000 ||
                             result.base64.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ');
        return !isPlaceholder;
      }).length;
      const failedImages = totalImages - successfulImages;
      const successRate = (successfulImages / totalImages) * 100;
      
      // Identificar SKUs que tuvieron errores en este batch
      const skusWithFailedImages = new Set<string>();
      batchItems.forEach(item => {
        const images = imageMapBase64[item.numero_articulo] || [];
        if (images.length === 0) {
          skusWithFailedImages.add(item.numero_articulo);
        } else {
          // Verificar si todas las imágenes son placeholders
          const allPlaceholders = images.every(img => 
            img.includes('No Image') || 
            img.length < 1000 || 
            img.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ')
          );
          if (allPlaceholders) {
            skusWithFailedImages.add(item.numero_articulo);
          }
        }
      });
      
      // También incluir SKUs que aparecen en errorLogs para este batch
      // Obtener errorLogs del estado usando un callback
      let errorLogsForBatch: typeof errorLogs = [];
      setErrorLogs(currentLogs => {
        errorLogsForBatch = currentLogs.filter(log => log.batchNumber === batchNumber);
        return currentLogs; // No modificar, solo leer
      });
      
      errorLogsForBatch.forEach(log => {
        if (log.sku) {
          const cleanSku = log.sku.replace(/_\d+$/, '');
          skusWithFailedImages.add(cleanSku);
        }
      });
      
      const failedSkus = Array.from(skusWithFailedImages);
      
      // Actualizar historial con resultados optimizados
      const batchResult = {
        batchNumber,
        totalProducts: batchItems.length,
        totalImages,
        successfulImages,
        failedImages,
        successRate: parseFloat(successRate.toFixed(1)),
        processingTime: parseFloat(((performance.now() - startTime) / 1000).toFixed(2)),
        status: 'completed' as const,
        failedSkus: failedSkus.length > 0 ? failedSkus : undefined
      };
      
      setBatchHistory(prev => prev.map(batch => 
        batch.batchNumber === batchNumber ? batchResult : batch
      ));

      // Actualizar datos
      setCotizacionData((currentData) => {
        if (!currentData) return null;
        
        const updatedItems = currentData.items.map((item) => {
          if (batchItems.some(batchItem => batchItem.numero_articulo === item.numero_articulo)) {
            return {
              ...item,
              imagenes: imageMapBase64[item.numero_articulo] || [],
            };
          }
          return item;
        });

        return {
          ...currentData,
          items: updatedItems,
        };
      });

      console.log(`✅ Optimized batch ${batchNumber} completed!`);
      console.log(`🎯 Optimized Quality: ${successfulImages}/${totalImages} successful (${successRate.toFixed(1)}%)`);

    } catch (error) {
      const errorTime = performance.now();
      console.error(`❌ Error in optimized batch ${batchNumber} after ${((errorTime - startTime) / 1000).toFixed(2)}s:`, error);
      
      // Marcar como fallido
      setBatchHistory(prev => prev.map(batch => 
        batch.batchNumber === batchNumber 
          ? { ...batch, status: 'failed' as const }
          : batch
      ));
    }
  };

  // Función para generar y descargar el archivo de log de errores
  const generateErrorLogFile = (logs: typeof errorLogs) => {
    if (logs.length === 0) {
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `error_log_${timestamp}.txt`;
    
    let logContent = `========================================\n`;
    logContent += `LOG DE ERRORES - PROCESAMIENTO DE IMÁGENES\n`;
    logContent += `Fecha: ${new Date().toLocaleString('es-ES')}\n`;
    logContent += `Total de errores: ${logs.length}\n`;
    logContent += `========================================\n\n`;
    
    // Agrupar errores por tipo
    const errorsByType = logs.reduce((acc, log) => {
      const type = log.errorType || 'Unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(log);
      return acc;
    }, {} as Record<string, typeof errorLogs>);
    
    logContent += `RESUMEN POR TIPO DE ERROR:\n`;
    logContent += `----------------------------\n`;
    Object.entries(errorsByType).forEach(([type, typeLogs]) => {
      logContent += `${type}: ${typeLogs.length} errores\n`;
    });
    logContent += `\n\n`;
    
    // Agrupar errores por SKU
    const errorsBySku = logs.reduce((acc, log) => {
      const sku = log.sku || 'Unknown';
      if (!acc[sku]) acc[sku] = [];
      acc[sku].push(log);
      return acc;
    }, {} as Record<string, typeof errorLogs>);
    
    logContent += `ERRORES POR SKU:\n`;
    logContent += `-----------------\n`;
    Object.entries(errorsBySku)
      .sort((a, b) => b[1].length - a[1].length) // Ordenar por cantidad de errores
      .forEach(([sku, skuLogs]) => {
        logContent += `\nSKU: ${sku} (${skuLogs.length} errores)\n`;
        skuLogs.forEach(log => {
          logContent += `  - [${log.timestamp}] Batch ${log.batchNumber || 'N/A'}, ID: ${log.id || 'N/A'}\n`;
          logContent += `    Error: ${log.error}\n`;
          if (log.url && log.url !== 'N/A') {
            logContent += `    URL: ${log.url}\n`;
          }
        });
      });
    
    logContent += `\n\nDETALLE COMPLETO DE ERRORES:\n`;
    logContent += `------------------------------\n`;
    logs.forEach((log, index) => {
      logContent += `\n${index + 1}. [${log.timestamp}] ${log.errorType}\n`;
      logContent += `   Batch: ${log.batchNumber || 'N/A'}\n`;
      logContent += `   SKU: ${log.sku || 'N/A'}\n`;
      logContent += `   ID: ${log.id || 'N/A'}\n`;
      logContent += `   Error: ${log.error}\n`;
      if (log.url && log.url !== 'N/A') {
        logContent += `   URL: ${log.url}\n`;
      }
    });
    
    // Crear y descargar el archivo
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`📄 Archivo de log de errores generado: ${filename} (${logs.length} errores)`);
  };

  const processImagesInBatches = async (items: CotizacionItem[]) => {
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    
    setBatchProcessing(true);
    setShowProgressModal(true);
    setBatchHistory([]);
    setShowFinalSummary(false);
    setErrorLogs([]); // Limpiar logs anteriores
    setBatchProgress({
      currentBatch: 0,
      totalBatches,
      currentBatchProgress: 0,
      totalProcessed: 0,
      totalImages: 0,
      successfulImages: 0,
      failedImages: 0,
      currentBatchImages: 0,
      currentBatchSuccessful: 0,
      currentBatchFailed: 0
    });
    
    console.log(`🚀 Starting batch processing: ${totalBatches} batches of ${BATCH_SIZE} products each`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, items.length);
      const batchItems = items.slice(startIndex, endIndex);
      
      console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batchItems.length} products)`);
      
      setBatchProgress(prev => ({
        ...prev,
        currentBatch: batchIndex + 1,
        currentBatchProgress: 0,
        currentBatchImages: 0,
        currentBatchSuccessful: 0,
        currentBatchFailed: 0
      }));
      
      await processBatch(batchItems, batchIndex + 1, totalBatches);
    }
    
    setBatchProcessing(false);
    setShowFinalSummary(true);
    
    console.log(`✅ Batch processing completed!`);
    
    // Generar archivo de log de errores si hay errores
    if (errorLogs.length > 0) {
      console.log(`📊 Total de errores registrados: ${errorLogs.length}`);
      // Usar setTimeout para asegurar que el estado se haya actualizado
      setTimeout(() => {
        generateErrorLogFile(errorLogs);
      }, 1000);
    }
  };

  const processBatch = async (batchItems: CotizacionItem[], batchNumber: number, totalBatches: number) => {
    const startTime = performance.now();
    console.log(`🚀 Starting image loading for batch ${batchNumber}/${totalBatches} (${batchItems.length} products)...`);
    
    // Debugging específico para el primer batch
    if (batchNumber === 1) {
      console.log(`🔍 DEBUGGING BATCH 1:`);
      console.log(`   📊 Total items in batch: ${batchItems.length}`);
      console.log(`   📋 First 5 SKUs:`, batchItems.slice(0, 5).map(item => item.numero_articulo));
      console.log(`   📋 Last 5 SKUs:`, batchItems.slice(-5).map(item => item.numero_articulo));
      console.log(`   🔍 SKU types:`, batchItems.slice(0, 5).map(item => typeof item.numero_articulo));
      console.log(`   🔍 SKU values:`, batchItems.slice(0, 5).map(item => item.numero_articulo));
    }
    
    // Retry logic para el primer batch que suele fallar
    const maxRetries = batchNumber === 1 ? 2 : 1;
    let lastError = null;
    const skus = batchItems.map((item) => item.numero_articulo);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for batch ${batchNumber} (${skus.length} SKUs)`);
          // Pequeña pausa antes del retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Debugging específico para el primer batch
        if (batchNumber === 1) {
          console.log(`🔍 BATCH 1 - Attempt ${attempt}:`);
          console.log(`   📤 Sending SKUs to backend:`, skus.slice(0, 10), skus.length > 10 ? `... and ${skus.length - 10} more` : '');
          console.log(`   🔍 SKU types being sent:`, skus.slice(0, 5).map(sku => typeof sku));
        }
        
        // Agregar identificador único al request
        const requestId = `batch_${batchNumber}_attempt_${attempt}_${Date.now()}`;
        console.log(`🔍 Request ID: ${requestId}`);
        
        const imageMap = await fetchImageMap(skus);
      
      const fetchTime = performance.now();
      console.log(`📥 Image URLs fetched for batch ${batchNumber} in ${(fetchTime - startTime).toFixed(2)}ms`);

      // Convertir TODAS las URLs a Base64 aquí mismo, para que Excel no tenga que hacerlo
      const imageMapBase64: Record<string, string[]> = {};
      
      // Procesar TODAS las imágenes usando Web Workers (máxima velocidad + no bloquea UI)
      // Usar límite dinámico basado en la cantidad total de SKUs
      const imageLimit = getImageLimit(cotizacionData?.items.length || 0);
      console.log(`📊 Image limit for ${cotizacionData?.items.length || 0} SKUs: ${imageLimit} images per SKU`);
      
      // Debug: Verificar las keys del imageMap
      if (batchNumber === 1) {
        console.log(`🔍 DEBUG: imageMap keys (first 10):`, Object.keys(imageMap).slice(0, 10));
        console.log(`🔍 DEBUG: Expected SKUs (first 10):`, skus.slice(0, 10));
        // Verificar si hay discrepancias
        const mismatched = Object.keys(imageMap).slice(0, 10).filter(key => {
          const cleanKey = key.includes('_') && /_\d+$/.test(key) ? key.replace(/_\d+$/, '') : key;
          return !skus.slice(0, 10).includes(cleanKey) && !skus.slice(0, 10).includes(key);
        });
        if (mismatched.length > 0) {
          console.warn(`⚠️ DEBUG: Found mismatched keys in imageMap:`, mismatched);
        }
      }
      
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => {
        // Asegurar que el SKU no tenga el sufijo _index (en caso de que el backend lo haya agregado por error)
        let cleanSku = sku;
        
        // Limpiar el SKU si tiene el patrón _número
        const match = sku.match(/^(.+)_(\d+)$/);
        if (match) {
          const [, baseSku, indexStr] = match;
          const index = parseInt(indexStr);
          // Si el índice está en el rango válido (0-9), probablemente es un sufijo agregado por error
          if (index >= 0 && index < 10) {
            cleanSku = baseSku;
            if (cleanSku !== sku && batchNumber === 1) {
              console.warn(`⚠️ SKU limpiado en imageMap: "${sku}" -> "${cleanSku}"`);
            }
          }
        }
        
        // También limpiar las URLs si contienen el SKU con sufijo
        const cleanedUrls = urls.map(url => {
          // Si la URL contiene el SKU con sufijo, reemplazarlo con el SKU limpio
          if (sku !== cleanSku && url.includes(`/${sku}/`)) {
            return url.replace(`/${sku}/`, `/${cleanSku}/`);
          }
          return url;
        });
        
        return cleanedUrls.slice(0, imageLimit).map((url, index) => ({ 
          sku: cleanSku, // Usar el SKU limpio
          url, 
          id: `${cleanSku}_${index}` // El id también debe usar el SKU limpio
        }));
      });
      
      console.log(`🔄 Converting ${allImageUrls.length} images for batch ${batchNumber} using Web Workers...`);
      
      // Actualizar progreso del lote actual
      setBatchProgress(prev => ({
        ...prev,
        currentBatchImages: allImageUrls.length
      }));
      
      // Crear Web Workers para procesamiento paralelo (optimizado para estabilidad)
      const workerCount = 1; // Solo 1 worker para evitar rate limiting
      const workers: Worker[] = [];
      const workerResults = new Map<string, { sku: string; base64: string | null }>();
      let completedTasks = 0;
      
      // Crear workers
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(new URL('../../../workers/imageWorker.ts', import.meta.url), { type: 'module' });
        workers.push(worker);
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean; url?: string }>) => {
          const { id, sku, base64, error, isPlaceholder, url } = event.data;
          
          if (error && isPlaceholder) {
            console.warn(`🔄 Using placeholder for ${id}: ${error}`);
            setErrorLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              batchNumber,
              sku,
              id,
              error,
              errorType: 'Placeholder',
              url: url || 'N/A'
            }]);
          } else if (error && !isPlaceholder) {
            setErrorLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              batchNumber,
              sku,
              id,
              error,
              errorType: 'Error',
              url: url || 'N/A'
            }]);
          }
          
          workerResults.set(id, { sku, base64 });
          completedTasks++;
          
          // Actualizar progreso del lote actual
          const currentProgress = (completedTasks / allImageUrls.length * 100).toFixed(1);
          setBatchProgress(prev => ({
            ...prev,
            currentBatchProgress: parseFloat(currentProgress)
          }));
          
          // Log progreso cada 10% completado para mejor feedback
          if (completedTasks % Math.ceil(allImageUrls.length / 10) === 0 || completedTasks === allImageUrls.length) {
            const progress = (completedTasks / allImageUrls.length * 100).toFixed(1);
            const elapsed = (performance.now() - startTime) / 1000;
            const rate = completedTasks / elapsed;
            console.log(`📊 Batch ${batchNumber} Progress: ${progress}% (${completedTasks}/${allImageUrls.length}) - ${rate.toFixed(1)} img/s`);
          }
        };
      }
      
      // Distribuir tareas entre workers con throttling optimizado
      // Reducir batch size y aumentar delay para no saturar el backend
      const batchSize = 3; // Procesar 3 imágenes a la vez (reducido para no saturar backend)
      for (let i = 0; i < allImageUrls.length; i += batchSize) {
        const batch = allImageUrls.slice(i, i + batchSize);
        
        // Distribuir batch entre workers
        batch.forEach((task, batchIndex) => {
          const workerIndex = (i + batchIndex) % workerCount;
          workers[workerIndex].postMessage(task);
        });
        
        // Pausa más larga entre batches para dar tiempo al backend
        if (i + batchSize < allImageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms entre batches
        }
      }
      
      // Esperar a que terminen todos los workers
      await new Promise<void>((resolve) => {
        const checkCompletion = () => {
          if (completedTasks === allImageUrls.length) {
            resolve();
          } else {
            setTimeout(checkCompletion, 100);
          }
        };
        checkCompletion();
      });
      
      // Terminar workers
      workers.forEach(worker => worker.terminate());
      
      // Agrupar resultados por SKU
      // Nota: workerResults es un Map donde la clave es el id (ej: "F5016_1") y el valor es { sku, base64 }
      workerResults.forEach((result) => {
        const { sku, base64 } = result;
        // Asegurar que el SKU no tenga el sufijo _index (si el worker por alguna razón devolvió el id como sku)
        // Solo limpiamos si el SKU termina en _número y ese número es un índice válido (0 hasta imageLimit-1)
        let cleanSku = sku;
        const match = sku.match(/^(.+)_(\d+)$/);
        if (match) {
          const [, baseSku, indexStr] = match;
          const index = parseInt(indexStr);
          // Si el índice está dentro del rango válido de imágenes (0 a imageLimit-1), probablemente es un sufijo agregado por error
          // Si es mayor, podría ser parte del SKU legítimo
          if (index >= 0 && index < imageLimit) {
            cleanSku = baseSku;
            // Log solo si detectamos una corrección
            if (cleanSku !== sku) {
              console.warn(`⚠️ SKU limpiado: "${sku}" -> "${cleanSku}" (índice ${index} detectado como sufijo)`);
            }
          }
        }
        if (base64) {
          if (!imageMapBase64[cleanSku]) {
            imageMapBase64[cleanSku] = [];
          }
          imageMapBase64[cleanSku].push(base64);
        }
      });

      const conversionTime = performance.now();
      console.log(`🔄 Base64 conversion completed for batch ${batchNumber} in ${(conversionTime - fetchTime).toFixed(2)}ms`);

      // Calcular estadísticas del lote actual
      const totalImages = allImageUrls.length;
      const successfulImages = Array.from(workerResults.values()).filter(result => {
        if (!result.base64) return false;
        // Detectar placeholders por tamaño (muy pequeños) o contenido específico
        const isPlaceholder = result.base64.includes('No Image') || 
                             result.base64.length < 1000 || // Base64 muy pequeño
                             result.base64.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'); // Nuestro placeholder
        return !isPlaceholder;
      }).length;
      const failedImages = totalImages - successfulImages;
      
      // Actualizar estadísticas del lote actual
      setBatchProgress(prev => ({
        ...prev,
        currentBatchSuccessful: successfulImages,
        currentBatchFailed: failedImages,
        totalProcessed: prev.totalProcessed + batchItems.length,
        successfulImages: prev.successfulImages + successfulImages,
        failedImages: prev.failedImages + failedImages,
        totalImages: prev.totalImages + totalImages
      }));

      // Guardar las imágenes YA EN BASE64 en cotizacionData
      setCotizacionData((currentData) => {
        if (!currentData) return null;
        
        const updatedItems = currentData.items.map((item) => {
          // Solo actualizar items del lote actual
          if (batchItems.some(batchItem => batchItem.numero_articulo === item.numero_articulo)) {
            return {
              ...item,
              // Guardar directamente los Base64, no las URLs relativas
              imagenes: imageMapBase64[item.numero_articulo] || [],
            };
          }
          return item;
        });

        return {
          ...currentData,
          items: updatedItems,
        };
      });

      const totalTime = performance.now();
      const totalSeconds = ((totalTime - startTime) / 1000).toFixed(2);
      const imagesPerSecond = (allImageUrls.length / (totalTime - startTime) * 1000).toFixed(1);
      const successRate = (successfulImages / totalImages) * 100;
      
      // Identificar SKUs que tuvieron errores en este batch
      // 1. SKUs que no tienen imágenes exitosas después del procesamiento
      const skusWithFailedImages = new Set<string>();
      batchItems.forEach(item => {
        const images = imageMapBase64[item.numero_articulo] || [];
        if (images.length === 0) {
          skusWithFailedImages.add(item.numero_articulo);
        } else {
          // Verificar si todas las imágenes son placeholders
          const allPlaceholders = images.every(img => 
            img.includes('No Image') || 
            img.length < 1000 || 
            img.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ')
          );
          if (allPlaceholders) {
            skusWithFailedImages.add(item.numero_articulo);
          }
        }
      });
      
      // 2. También incluir SKUs que aparecen en errorLogs para este batch
      // Obtener errorLogs del estado usando un callback
      let errorLogsForBatch: typeof errorLogs = [];
      setErrorLogs(currentLogs => {
        errorLogsForBatch = currentLogs.filter(log => log.batchNumber === batchNumber);
        return currentLogs; // No modificar, solo leer
      });
      
      errorLogsForBatch.forEach(log => {
        if (log.sku) {
          // Limpiar el SKU si tiene sufijo _número
          const cleanSku = log.sku.replace(/_\d+$/, '');
          skusWithFailedImages.add(cleanSku);
        }
      });
      
      const failedSkus = Array.from(skusWithFailedImages);
      
      // Agregar al historial de lotes
      const batchResult = {
        batchNumber,
        totalProducts: batchItems.length,
        totalImages,
        successfulImages,
        failedImages,
        successRate: parseFloat(successRate.toFixed(1)),
        processingTime: parseFloat(totalSeconds),
        status: 'completed' as const,
        failedSkus: failedSkus.length > 0 ? failedSkus : undefined
      };
      
      // Si el batch ya existe en el historial, actualizarlo; si no, agregarlo
      setBatchHistory(prev => {
        const existingIndex = prev.findIndex(b => b.batchNumber === batchNumber);
        if (existingIndex >= 0) {
          // Actualizar batch existente
          const updated = [...prev];
          updated[existingIndex] = batchResult;
          return updated;
        } else {
          // Agregar nuevo batch
          return [...prev, batchResult];
        }
      });
      
        console.log(`✅ Batch ${batchNumber} completed successfully!`);
        console.log(`⏱️  Batch time: ${totalSeconds}s`);
        console.log(`📊 Performance: ${imagesPerSecond} images/second`);
        console.log(`🎯 Batch Quality: ${successfulImages}/${totalImages} successful (${successRate.toFixed(1)}%)`);
        
        // Si llegamos aquí, el batch fue exitoso, salir del bucle de retry
        return;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Error in batch ${batchNumber}, attempt ${attempt}/${maxRetries}:`, error);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Will retry batch ${batchNumber} in 1 second...`);
          continue;
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    if (lastError) {
      const errorTime = performance.now();
      console.error(`❌ Error in batch ${batchNumber} after ${((errorTime - startTime) / 1000).toFixed(2)}s:`, lastError);
      
      // Log detallado del error para debugging
      if (lastError && typeof lastError === 'object' && 'response' in lastError) {
        const axiosError = lastError as any;
        console.error(`🔍 Error details for batch ${batchNumber}:`);
        console.error(`   Status: ${axiosError.response?.status}`);
        console.error(`   Status Text: ${axiosError.response?.statusText}`);
        console.error(`   Response Data:`, axiosError.response?.data);
        console.error(`   Request URL: ${axiosError.config?.url}`);
        console.error(`   Request Method: ${axiosError.config?.method}`);
        console.error(`   SKUs being processed:`, skus.slice(0, 5), skus.length > 5 ? `... and ${skus.length - 5} more` : '');
      }
      
      // Agregar lote fallido al historial para permitir recarga
      const failedBatchResult = {
        batchNumber,
        totalProducts: batchItems.length,
        totalImages: 0,
        successfulImages: 0,
        failedImages: 0,
        successRate: 0,
        processingTime: parseFloat(((errorTime - startTime) / 1000).toFixed(2)),
        status: 'failed' as const
      };
      
      setBatchHistory(prev => [...prev, failedBatchResult]);
      
      console.log(`📝 Added failed batch ${batchNumber} to history for potential reload`);
      
      // Actualizar estadísticas de error
      setBatchProgress(prev => ({
        ...prev,
        currentBatchFailed: prev.currentBatchFailed + batchItems.length
      }));
    }
  };


  const fetchAndSetRealImages = async (items: CotizacionItem[]) => {
    setLoadingImages(true);
    const startTime = performance.now();
    console.log(`🚀 Starting image loading for ${items.length} products...`);
    
    try {
      const skus = items.map((item) => item.numero_articulo);
      const imageMap = await fetchImageMap(skus);
      
      const fetchTime = performance.now();
      console.log(`📥 Image URLs fetched in ${(fetchTime - startTime).toFixed(2)}ms`);

      // Importar función para convertir a Base64

      // Convertir TODAS las URLs a Base64 aquí mismo, para que Excel no tenga que hacerlo
      const imageMapBase64: Record<string, string[]> = {};
      
      // Procesar TODAS las imágenes usando Web Workers (máxima velocidad + no bloquea UI)
      // Usar límite dinámico basado en la cantidad total de SKUs
      const imageLimit = getImageLimit(items.length);
      console.log(`📊 Image limit for ${items.length} SKUs: ${imageLimit} images per SKU`);
      
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => {
        // Asegurar que el SKU no tenga el sufijo _index (en caso de que el backend lo haya agregado por error)
        let cleanSku = sku;
        
        // Limpiar el SKU si tiene el patrón _número
        const match = sku.match(/^(.+)_(\d+)$/);
        if (match) {
          const [, baseSku, indexStr] = match;
          const index = parseInt(indexStr);
          // Si el índice está en el rango válido (0-9), probablemente es un sufijo agregado por error
          if (index >= 0 && index < 10) {
            cleanSku = baseSku;
          }
        }
        
        // También limpiar las URLs si contienen el SKU con sufijo
        const cleanedUrls = urls.map(url => {
          // Si la URL contiene el SKU con sufijo, reemplazarlo con el SKU limpio
          if (sku !== cleanSku && url.includes(`/${sku}/`)) {
            return url.replace(`/${sku}/`, `/${cleanSku}/`);
          }
          return url;
        });
        
        return cleanedUrls.slice(0, imageLimit).map((url, index) => ({ 
          sku: cleanSku, // Usar el SKU limpio
          url, 
          id: `${cleanSku}_${index}` // El id también debe usar el SKU limpio
        }));
      });
      
      console.log(`🔄 Converting ${allImageUrls.length} images using Web Workers...`);
      
      // Crear Web Workers para procesamiento paralelo (optimizado para estabilidad)
      const workerCount = 1; // Solo 1 worker para evitar rate limiting
      const workers: Worker[] = [];
      const workerResults = new Map<string, { sku: string; base64: string | null }>();
      let completedTasks = 0;
      
      // Crear workers
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(new URL('../../../workers/imageWorker.ts', import.meta.url), { type: 'module' });
        workers.push(worker);
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean; url?: string }>) => {
          const { id, sku, base64, error, isPlaceholder, url } = event.data;
          
          if (error) {
            if (isPlaceholder) {
              console.warn(`🔄 Using placeholder for ${id}: ${error}`);
              setErrorLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                sku,
                id,
                error,
                errorType: 'Placeholder',
                url: url || 'N/A'
              }]);
            } else {
              console.warn(`❌ Worker error for ${id}:`, error);
              setErrorLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                sku,
                id,
                error,
                errorType: 'Error',
                url: url || 'N/A'
              }]);
            }
          }
          
          workerResults.set(id, { sku, base64 });
          completedTasks++;
          
          // Log progreso cada 10% completado para mejor feedback
          if (completedTasks % Math.ceil(allImageUrls.length / 10) === 0 || completedTasks === allImageUrls.length) {
            const progress = (completedTasks / allImageUrls.length * 100).toFixed(1);
            const elapsed = (performance.now() - startTime) / 1000;
            const rate = completedTasks / elapsed;
            console.log(`📊 Progress: ${progress}% (${completedTasks}/${allImageUrls.length}) - ${rate.toFixed(1)} img/s`);
          }
        };
      }
      
      // Distribuir tareas entre workers con throttling optimizado
      // Reducir batch size y aumentar delay para no saturar el backend
      const batchSize = 3; // Procesar 3 imágenes a la vez (reducido para no saturar backend)
      for (let i = 0; i < allImageUrls.length; i += batchSize) {
        const batch = allImageUrls.slice(i, i + batchSize);
        
        // Distribuir batch entre workers
        batch.forEach((task, batchIndex) => {
          const workerIndex = (i + batchIndex) % workerCount;
          workers[workerIndex].postMessage(task);
        });
        
        // Pausa más larga entre batches para dar tiempo al backend
        if (i + batchSize < allImageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms entre batches
        }
      }
      
      // Esperar a que terminen todos los workers
      await new Promise<void>((resolve) => {
        const checkCompletion = () => {
          if (completedTasks === allImageUrls.length) {
            resolve();
          } else {
            setTimeout(checkCompletion, 100);
          }
        };
        checkCompletion();
      });
      
      // Terminar workers
      workers.forEach(worker => worker.terminate());
      
      // Agrupar resultados por SKU
      // Nota: workerResults es un Map donde la clave es el id (ej: "F5016_1") y el valor es { sku, base64 }
      workerResults.forEach((result) => {
        const { sku, base64 } = result;
        // Asegurar que el SKU no tenga el sufijo _index (si el worker por alguna razón devolvió el id como sku)
        // Solo limpiamos si el SKU termina en _número y ese número es un índice válido (0 hasta imageLimit-1)
        let cleanSku = sku;
        const match = sku.match(/^(.+)_(\d+)$/);
        if (match) {
          const [, baseSku, indexStr] = match;
          const index = parseInt(indexStr);
          // Si el índice está dentro del rango válido de imágenes (0 a imageLimit-1), probablemente es un sufijo agregado por error
          // Si es mayor, podría ser parte del SKU legítimo
          if (index >= 0 && index < imageLimit) {
            cleanSku = baseSku;
            // Log solo si detectamos una corrección
            if (cleanSku !== sku) {
              console.warn(`⚠️ SKU limpiado: "${sku}" -> "${cleanSku}" (índice ${index} detectado como sufijo)`);
            }
          }
        }
        if (base64) {
          if (!imageMapBase64[cleanSku]) {
            imageMapBase64[cleanSku] = [];
          }
          imageMapBase64[cleanSku].push(base64);
        }
      });

      const conversionTime = performance.now();
      console.log(`🔄 Base64 conversion completed in ${(conversionTime - fetchTime).toFixed(2)}ms`);

      // Guardar las imágenes YA EN BASE64 en cotizacionData
      setCotizacionData((currentData) => {
        if (!currentData) return null;

        const updatedItems = currentData.items.map((item) => {
          return {
            ...item,
            // Guardar directamente los Base64, no las URLs relativas
            imagenes: imageMapBase64[item.numero_articulo] || [],
          };
        });

        return {
          ...currentData,
          items: updatedItems,
        };
      });

      const totalTime = performance.now();
      const totalSeconds = ((totalTime - startTime) / 1000).toFixed(2);
      const imagesPerSecond = (allImageUrls.length / (totalTime - startTime) * 1000).toFixed(1);
      
      // Calcular estadísticas de calidad (mejor detección de placeholders)
      const totalImages = allImageUrls.length;
      const successfulImages = Array.from(workerResults.values()).filter(result => {
        if (!result.base64) return false;
        // Detectar placeholders por tamaño (muy pequeños) o contenido específico
        const isPlaceholder = result.base64.includes('No Image') || 
                             result.base64.length < 1000 || // Base64 muy pequeño
                             result.base64.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'); // Nuestro placeholder
        return !isPlaceholder;
      }).length;
      const placeholderImages = totalImages - successfulImages;
      const successRate = ((successfulImages / totalImages) * 100).toFixed(1);
      
      console.log(`✅ All images processed successfully!`);
      console.log(`⏱️  Total time: ${totalSeconds}s`);
      console.log(`📊 Performance: ${imagesPerSecond} images/second`);
      console.log(`🎯 Quality Stats:`);
      console.log(`   ✅ Successful: ${successfulImages}/${totalImages} (${successRate}%)`);
      console.log(`   🔄 Placeholders: ${placeholderImages}/${totalImages} (${(100 - parseFloat(successRate)).toFixed(1)}%)`);
      console.log(`📈 Breakdown:`);
      console.log(`   📥 URL fetch: ${(fetchTime - startTime).toFixed(2)}ms`);
      console.log(`   🔄 Base64 conversion: ${(conversionTime - fetchTime).toFixed(2)}ms`);
      console.log(`   💾 State update: ${(totalTime - conversionTime).toFixed(2)}ms`);

      notifications.show({
        title: 'Imágenes cargadas',
        message: `Procesadas en ${totalSeconds}s (${imagesPerSecond} img/s). ${successfulImages}/${totalImages} exitosas (${successRate}%). ${placeholderImages > 0 ? `${placeholderImages} con placeholder.` : 'Todas las imágenes cargadas correctamente.'}`,
        color: placeholderImages > 0 ? 'orange' : 'green',
        icon: <IconUpload size="1rem" />
      });

    } catch (error) {
      const errorTime = performance.now();
      console.error(`❌ Error after ${((errorTime - startTime) / 1000).toFixed(2)}s:`, error);
      
      notifications.show({
        title: 'Error al cargar imágenes',
        message: 'No se pudieron obtener las imágenes de la base de datos.',
        color: 'orange',
        icon: <IconAlertCircle size="1rem" />
      });
    } finally {
      setLoadingImages(false);
    }
  };

  const reloadProductImages = async (sku: string) => {
    if (!cotizacionData) return;
    
    setReloadingProducts(prev => new Set(prev).add(sku));
    
    try {
      console.log(`🔄 Reloading images for product: ${sku}`);
      
      // Obtener URLs de imágenes para este SKU específico
      const imageMap = await fetchImageMap([sku]);
      
      if (imageMap[sku] && imageMap[sku].length > 0) {
        // Procesar imágenes del producto usando Web Workers
        const imageUrls = imageMap[sku].map((url, index) => ({ sku, url, id: `${sku}_${index}` }));
        
        const worker = new Worker(new URL('../../../workers/imageWorker.ts', import.meta.url), { type: 'module' });
        const workerResults = new Map<string, { sku: string; base64: string | null }>();
        let completedTasks = 0;
        
        let successfulImages = 0;
        let failedImages = 0;
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean; url?: string }>) => {
          const { id, sku, base64, error, isPlaceholder, url } = event.data;
          
          if (error && isPlaceholder) {
            console.warn(`🔄 Using placeholder for ${id}: ${error}`);
            failedImages++;
            setErrorLogs(prev => [...prev, {
              timestamp: new Date().toISOString(),
              sku,
              id,
              error,
              errorType: 'Placeholder',
              url: url || 'N/A'
            }]);
          } else if (base64) {
            // Verificar si es una imagen real (no placeholder)
            const isRealImage = base64.length > 1000 && !base64.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ');
            if (isRealImage) {
              successfulImages++;
            } else {
              failedImages++;
            }
          } else {
            failedImages++;
          }
          
          workerResults.set(id, { sku, base64 });
          completedTasks++;
        };
        
        // Procesar todas las imágenes del producto
        imageUrls.forEach(task => worker.postMessage(task));
        
        // Esperar a que terminen
        await new Promise<void>((resolve) => {
          const checkCompletion = () => {
            if (completedTasks === imageUrls.length) {
              resolve();
            } else {
              setTimeout(checkCompletion, 100);
            }
          };
          checkCompletion();
        });
        
        worker.terminate();
        
        // Actualizar solo las imágenes de este producto
        const newImages = Array.from(workerResults.values())
          .filter(result => result.sku === sku && result.base64)
          .map(result => result.base64!);
        
        setCotizacionData(currentData => {
          if (!currentData) return null;
          
          const updatedItems = currentData.items.map(item => {
            if (item.numero_articulo === sku) {
              return { ...item, imagenes: newImages };
            }
            return item;
          });
          
          return { ...currentData, items: updatedItems };
        });
        
        // Notificación con estadísticas reales
        const message = successfulImages > 0 
          ? `✅ ${successfulImages} imágenes exitosas, ${failedImages} fallidas para ${sku}`
          : `❌ Todas las imágenes fallaron para ${sku}`;
        
        notifications.show({
          title: 'Recarga completada',
          message,
          color: successfulImages > 0 ? 'green' : 'red',
          icon: <IconRefresh size="1rem" />
        });
        
      } else {
        notifications.show({
          title: 'Sin imágenes',
          message: `No se encontraron imágenes para el producto ${sku}`,
          color: 'orange',
          icon: <IconAlertCircle size="1rem" />
        });
      }
      
    } catch (error) {
      console.error(`Error reloading images for ${sku}:`, error);
      notifications.show({
        title: 'Error al recargar',
        message: `No se pudieron recargar las imágenes del producto ${sku}`,
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
    } finally {
      setReloadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(sku);
        return newSet;
      });
    }
  };

  const removeImageFromProduct = (sku: string, imageIndex: number) => {
    if (!cotizacionData) return;
    
    setCotizacionData(currentData => {
      if (!currentData) return null;
      
      const updatedItems = currentData.items.map(item => {
        if (item.numero_articulo === sku && item.imagenes) {
          const newImages = [...item.imagenes];
          newImages.splice(imageIndex, 1); // Eliminar imagen en el índice específico
          
          return { ...item, imagenes: newImages };
        }
        return item;
      });
      
      return { ...currentData, items: updatedItems };
    });
    
    notifications.show({
      title: 'Imagen eliminada',
      message: `Se eliminó la imagen ${imageIndex + 1} del producto ${sku}`,
      color: 'orange',
      icon: <IconX size="1rem" />
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true); // Loading principal

    // Quitamos el setTimeout, usamos la promesa del FileReader
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const items: CotizacionItem[] = [];
        let totalEstimado = 0;

        // Detectar automáticamente las columnas del Excel
        const headerRow = jsonData[0] as any[];
        const columnCount = headerRow ? headerRow.length : 0;
        
        console.log(`📊 Processing Excel with ${jsonData.length} rows (including header)`);
        console.log(`📊 Detected columns: ${columnCount}`);
        console.log(`📊 Column headers:`, headerRow);

        let processedRows = 0;
        let skippedValidation = 0;
        let consecutiveEmptyRows = 0;
        let rowsWithSKU = 0;
        const maxConsecutiveEmpty = 10; // Parar después de 10 filas vacías consecutivas

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          processedRows++;
          
          // Verificar si hay SKU en la primera columna (columna 0)
          const hasSKU = row && row.length > 0 && row[0] && row[0].toString().trim() !== '';
          
          if (!hasSKU) {
            consecutiveEmptyRows++;
            if (consecutiveEmptyRows >= maxConsecutiveEmpty) {
              console.log(`🛑 Stopping processing at row ${i}: Found ${consecutiveEmptyRows} consecutive rows without SKU`);
              break;
            }
            continue;
          } else {
            consecutiveEmptyRows = 0; // Resetear contador si encontramos SKU
            rowsWithSKU++; // Contar filas que tienen SKU
          }
          
          // Procesar si tiene SKU válido, independientemente del número de columnas
          if (row && row.length > 0) {
            // Función helper para obtener valores de manera segura
            const getValue = (index: number, defaultValue: any = '') => {
              return row && row.length > index ? row[index] : defaultValue;
            };

            const numeroArticulo = getValue(0, '');
            const descripcionArticulo = getValue(1, '');

            // Detectar automáticamente las columnas de pedido y precio
            // Buscar columnas que contengan "pedido", "cantidad", "qty", "order" o similares
            let pedidoCol = -1;
            let precioCol = -1;
            
            for (let col = 0; col < Math.min(row.length, 20); col++) {
              const header = headerRow[col] ? headerRow[col].toString().toLowerCase() : '';
              if (header.includes('pedido') || header.includes('cantidad') || header.includes('qty') || header.includes('order')) {
                pedidoCol = col;
              }
              if (header.includes('fob') || header.includes('precio') || header.includes('price') || header.includes('cost')) {
                precioCol = col;
              }
            }

            // Si no encontramos columnas específicas, usar valores por defecto
            const pedido = pedidoCol >= 0 ? parseFloat(getValue(pedidoCol, 0)) || 0 : 0;
            const precio = precioCol >= 0 ? parseFloat(getValue(precioCol, 0)) || 0 : 0;

            const subtotal = pedido * precio;

            // Validación más flexible: solo requiere SKU y descripción
            if (numeroArticulo && descripcionArticulo) {
              // Crear objeto dinámico con todas las columnas disponibles
              const dynamicItem: any = {
                numero_articulo: numeroArticulo,
                descripcion_articulo: descripcionArticulo,
                pedido: pedido,
                fob: precio,
                subtotal: subtotal,
                observaciones: '',
                imagenes: [], // Empezamos con array vacío
              };

              // Mapear columnas comunes dinámicamente usando la función helper robusta
              for (let col = 0; col < Math.min(row.length, 20); col++) {
                const header = headerRow[col] ? headerRow[col].toString() : '';
                const value = getValue(col, '');
                
                // Usar la función helper para mapear el header a la key correspondiente
                const mappedKey = mapHeaderToKey(header);
                
                if (mappedKey) {
                  // Si es un campo numérico, convertir a número
                  if (mappedKey === 'volumen_total' || mappedKey === 'volumen_unidad_compra' || 
                      mappedKey === 'volumen_dealer' || mappedKey === 'last_fob' || 
                      mappedKey === 'fob' || mappedKey === 'pedido') {
                    (dynamicItem as any)[mappedKey] = parseFloat(value) || 0;
                  } else {
                    (dynamicItem as any)[mappedKey] = value;
                  }
                }
              }

              // Agregar columnas adicionales como campos dinámicos
              for (let col = 0; col < row.length; col++) {
                const header = headerRow[col] ? headerRow[col].toString() : `Columna_${col + 1}`;
                if (!dynamicItem[header.toLowerCase().replace(/\s+/g, '_')]) {
                  dynamicItem[`columna_${col + 1}`] = getValue(col, '');
                }
              }

              items.push(dynamicItem as CotizacionItem);
              totalEstimado += subtotal;
            } else {
              skippedValidation++;
              if (skippedValidation <= 10) { // Mostrar más ejemplos
                console.log(`⚠️ Skipped row ${i}: SKU="${numeroArticulo}", Desc="${descripcionArticulo}", Pedido=${pedido}`);
                console.log(`   Raw row data:`, row.slice(0, 5)); // Mostrar primeros 5 campos
              }
            }
          }
        }

        // Log de estadísticas finales
        console.log(`📊 Excel Processing Summary:`);
        console.log(`   📥 Total rows processed: ${processedRows}`);
        console.log(`   🔍 Rows with SKU: ${rowsWithSKU}`);
        console.log(`   ❌ Skipped (validation failed): ${skippedValidation}`);
        console.log(`   ✅ Successfully processed: ${items.length}`);
        console.log(`   📊 Success rate: ${((items.length / rowsWithSKU) * 100).toFixed(1)}% (based on rows with SKU)`);
        console.log(`   🚀 Performance: Processed ${processedRows} rows instead of ${jsonData.length} total rows`);
        console.log(`   💡 Note: Now processing all rows with SKU regardless of column count`);

        const result: CotizacionData = {
          items,
          total_items: items.length,
          total_estimado: totalEstimado,
          tipoCliente: 'estandar', // Ahora siempre es estándar
          originalHeaders: headerRow, // Guardar headers originales para mantener orden
        };

        // --- ¡ACCIÓN CLAVE! ---
        // 1. Mostrar la tabla inmediatamente
        setCotizacionData(result);
        setNombreCotizacion(file.name.replace(/\.[^/.]+$/, ""));

        notifications.show({
          title: 'Archivo cargado exitosamente',
          message: `Se procesaron ${items.length} items. Buscando imágenes...`,
          color: 'green',
          icon: <IconCheck size="1rem" />
        });

            // 2. Iniciar la búsqueda de imágenes reales EN SEGUNDO PLANO
            // Siempre usar procesamiento por lotes para mostrar el modal de progreso
            processImagesInBatches(items);

      } catch (error) {
        console.error('Error procesando Excel:', error);
        notifications.show({
          title: 'Error al procesar el archivo',
          message: 'El archivo Excel no pudo ser procesado correctamente',
          color: 'red',
          icon: <IconAlertCircle size="1rem" />
        });
      } finally {
        setLoading(false); // Termina el loading principal
      }
    };

    reader.onerror = () => {
      console.error('Error leyendo archivo');
      notifications.show({
        title: 'Error al leer el archivo',
        message: 'No se pudo leer el archivo seleccionado',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [fetchAndSetRealImages]); // Removemos tipoCliente de las dependencias

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleLimpiar = () => {
    setCotizacionData(null);
    setNombreCotizacion('');
    setObservaciones('');
  };

  const handleExportar = async () => {
    if (!cotizacionData) return;

    try {
      setLoading(true);

      // Las imágenes ya están cargadas en cotizacionData desde la vista previa
      // Solo generamos y descargamos el Excel
      await exportarCotizacionConImagenes(
        cotizacionData,
        nombreCotizacion || 'cotizacion_export'
      );

      notifications.show({
        title: 'Excel exportado exitosamente',
        message: `Se exportaron ${cotizacionData.items.length} productos con imágenes`,
        color: 'green',
        icon: <IconCheck size="1rem" />
      });

    } catch (error) {
      console.error('Error exportando Excel:', error);
      notifications.show({
        title: 'Error al exportar',
        message: 'No se pudo exportar el archivo Excel',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      // No longer needed as isExporting is removed
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <>
    <Box>
      <Title order={2} mb="xl">Cotizador</Title>

      <Stack gap="lg">
        {/* Información del formato estándar */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={500}>Formato Estándar de Cotización</Text>
            <Text size="sm" c="dimmed">
              El sistema ahora detecta automáticamente las columnas del archivo Excel. 
              Solo es necesario que la primera columna contenga el SKU del producto.
              El sistema agregará automáticamente las columnas de imágenes al final.
            </Text>
          </Stack>
        </Paper>

        {/* Sección de carga de archivo */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={500}>Cargar Archivo Excel</Text>
            <Text size="sm" c="dimmed">
              Arrastra y suelta un archivo Excel (.xlsx, .xls) o haz clic para seleccionar.
              El archivo debe tener el SKU en la primera columna. El sistema detectará automáticamente 
              todas las demás columnas y las procesará dinámicamente.
              <br /><strong>Nota:</strong> Se agregarán automáticamente las columnas de imágenes al final (5 si son menos de 500 SKU, 3 si son más).
            </Text>

            <Paper
              {...getRootProps()}
              p="xl"
              style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isDragActive ? '#f8f9fa' : 'transparent',
                transition: 'background-color 0.2s'
              }}
            >
              <input {...getInputProps()} />
              <Center>
                <Stack align="center" gap="sm">
                  {loading ? (
                    <Loader size="md" />
                  ) : (
                    <IconUpload size={48} color="#666" />
                  )}
                  <Text ta="center" size="sm">
                    {isDragActive
                      ? 'Suelta el archivo aquí...'
                      : 'Arrastra un archivo Excel aquí o haz clic para seleccionar'
                    }
                  </Text>
                  <Text size="xs" c="dimmed">
                    Formatos soportados: .xlsx, .xls, .csv
                  </Text>
                </Stack>
              </Center>
            </Paper>
          </Stack>
        </Paper>

        {/* Información de la cotización */}
        {cotizacionData && (
          <Paper p="lg" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="lg" fw={500}>Información de la Cotización</Text>
                    <Group>
                      <Button
                        variant="outline"
                        leftSection={loading || loadingImages ? <Loader size="1rem" /> : <IconDownload size="1rem" />}
                        onClick={handleExportar}
                        loading={loading}
                        disabled={loading || loadingImages}
                      >
                        {loading ? 'Exportando...' : (loadingImages ? 'Cargando Imágenes...' : 'Exportar')}
                      </Button>
                      <Button
                        variant="outline"
                        color="blue"
                        leftSection={<IconRefresh size="1rem" />}
                        onClick={() => {
                          if (cotizacionData) {
                            processImagesInBatches(cotizacionData.items);
                          }
                        }}
                        disabled={loadingImages}
                        title="Recargar todas las imágenes"
                      >
                        Recargar Imágenes
                      </Button>
                      <Button
                        variant="outline"
                        color="red"
                        leftSection={<IconTrash size="1rem" />}
                        onClick={handleLimpiar}
                      >
                        Limpiar
                      </Button>
                    </Group>
              </Group>

              <Divider />

              <Group>
                <TextInput
                  label="Nombre de la Cotización"
                  placeholder="Ingresa un nombre para la cotización"
                  value={nombreCotizacion}
                  onChange={(e) => setNombreCotizacion(e.target.value)}
                  style={{ flex: 1 }}
                />
              </Group>

              <Textarea
                label="Observaciones"
                placeholder="Observaciones adicionales sobre la cotización"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />

              <Group>
                <Badge size="lg" color="blue">
                  Total Items: {cotizacionData.total_items}
                </Badge>
                <Badge size="lg" color="green">
                  Total Estimado: ${cotizacionData.total_estimado?.toLocaleString() || '0'}
                </Badge>
              </Group>

              <Divider />

              <Text size="md" fw={500}>Items de la Cotización</Text>

              <Box style={{ 
                overflowX: 'auto', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <Table striped highlightOnHover style={{ minWidth: '100%' }}>
                  <Table.Thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <Table.Tr>
                      {generateTableColumns(cotizacionData.items, cotizacionData.originalHeaders).map((column) => (
                        <Table.Th key={column.key} style={{ minWidth: column.width }}>
                          {column.label}
                        </Table.Th>
                      ))}
                      <Table.Th style={{ minWidth: '100px' }}>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {cotizacionData.items.map((item, index) => (
                      <Table.Tr key={index}>
                        {generateTableColumns(cotizacionData.items, cotizacionData.originalHeaders).map((column) => {
                          if (column.key.startsWith('imagen_')) {
                            const imgIndex = parseInt(column.key.replace('imagen_', '')) - 1;
                            return (
                              <Table.Td key={column.key}>
                                <Group gap="xs" wrap="nowrap">
                                  {item.imagenes && item.imagenes[imgIndex] && (
                                    <Box style={{ position: 'relative' }}>
                                      <ProductImage
                                        src={item.imagenes[imgIndex]}
                                        alt={`Imagen ${imgIndex + 1}`}
                                        numeroArticulo={`${item.numero_articulo} - Img ${imgIndex + 1}`}
                                        size={35}
                                        todasLasImagenes={item.imagenes}
                                        showDeleteButton={true}
                                        onDelete={(index) => removeImageFromProduct(item.numero_articulo, index)}
                                      />
                                    </Box>
                                  )}
                                </Group>
                              </Table.Td>
                            );
                          } else {
                            const value = (item as any)[column.key];
                            return (
                              <Table.Td key={column.key}>
                                {column.key === 'fob' || column.key === 'last_fob' ? 
                                  `$${value ? parseFloat(value).toLocaleString() : '0'}` : 
                                  value || ''
                                }
                              </Table.Td>
                            );
                          }
                        })}
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={reloadingProducts.has(item.numero_articulo) ? <Loader size="0.8rem" /> : <IconRefresh size="0.8rem" />}
                            onClick={() => reloadProductImages(item.numero_articulo)}
                            loading={reloadingProducts.has(item.numero_articulo)}
                            disabled={loadingImages}
                            title="Recargar imágenes de este producto"
                          >
                            {reloadingProducts.has(item.numero_articulo) ? 'Recargando...' : 'Recargar'}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Información de ayuda */}
        <Alert
          icon={<IconFileSpreadsheet size="1rem" />}
          title="Formato del archivo Excel - Estándar"
          color="blue"
          variant="light"
        >
          <Text size="sm">
            El archivo Excel debe tener las siguientes características:
          </Text>
          <Text size="sm" mt="xs">
            <strong>Requisito obligatorio:</strong><br />
            • <strong>Columna A:</strong> SKU del producto (primera columna)<br />
            • <strong>Columna B:</strong> Descripción del producto (recomendado)<br />
            <br />
            <strong>Columnas opcionales (se detectan automáticamente):</strong><br />
            • Nombre extranjero, Nombre chino, Marca, Modelo, etc.<br />
            • Columnas de pedido, cantidad, FOB, precio, etc.<br />
            • Cualquier otra columna será procesada dinámicamente<br />
            <br />
            <strong>Columnas de imágenes:</strong><br />
            • Se agregan automáticamente al final del archivo<br />
            • 5 columnas si hay menos de 500 SKUs<br />
            • 3 columnas si hay 500 o más SKUs
          </Text>
          <Text size="sm" mt="md" c="dimmed">
            <strong>Nota:</strong> El sistema detecta automáticamente los nombres de las columnas y las procesa dinámicamente, 
            por lo que no es necesario seguir un formato específico más allá de tener el SKU en la primera columna.
          </Text>
        </Alert>
      </Stack>
    </Box>

    {/* Modal de Progreso por Lotes */}
    <Modal
      opened={showProgressModal}
      onClose={() => {
        if (showFinalSummary) {
          setShowProgressModal(false);
        }
      }}
      title={showFinalSummary ? "Resumen Final - Procesamiento Completado" : "Procesando Imágenes por Lotes"}
      size="xl"
      centered
      closeOnClickOutside={showFinalSummary}
      closeOnEscape={showFinalSummary}
      withCloseButton={true}
    >
      <Stack gap="md">
        <Text size="lg" fw={500}>
          Procesando lote {batchProgress.currentBatch} de {batchProgress.totalBatches}
        </Text>
        
        {/* Progreso General */}
        <Box>
          <Text size="sm" mb="xs">Progreso General</Text>
          <Progress 
            value={(batchProgress.currentBatch / batchProgress.totalBatches) * 100} 
            size="lg" 
            radius="md"
            color="blue"
          />
          <Text size="xs" c="dimmed" mt="xs">
            {batchProgress.currentBatch}/{batchProgress.totalBatches} lotes completados
          </Text>
        </Box>

        {/* Progreso del Lote Actual */}
        <Box>
          <Text size="sm" mb="xs">Progreso del Lote Actual</Text>
          <Progress 
            value={batchProgress.currentBatchProgress} 
            size="md" 
            radius="md"
            color="green"
          />
          <Text size="xs" c="dimmed" mt="xs">
            {batchProgress.currentBatchProgress.toFixed(1)}% completado
          </Text>
        </Box>

        {/* Estadísticas */}
        <Grid>
          <Grid.Col span={6}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} c="blue">Productos Procesados</Text>
              <Text size="xl" fw={700}>{batchProgress.totalProcessed}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={6}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} c="green">Imágenes Exitosas</Text>
              <Text size="xl" fw={700}>{batchProgress.successfulImages}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={6}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} c="orange">Imágenes Fallidas</Text>
              <Text size="xl" fw={700}>{batchProgress.failedImages}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={6}>
            <Card withBorder p="sm">
              <Text size="sm" fw={500} c="purple">Tasa de Éxito</Text>
              <Text size="xl" fw={700}>
                {batchProgress.totalImages > 0 
                  ? ((batchProgress.successfulImages / batchProgress.totalImages) * 100).toFixed(1)
                  : 0}%
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Estadísticas del Lote Actual */}
        <Box>
          <Text size="sm" fw={500} mb="xs">Lote Actual</Text>
          <Group>
            <Badge color="green" size="lg">
              ✅ {batchProgress.currentBatchSuccessful} exitosas
            </Badge>
            <Badge color="orange" size="lg">
              ❌ {batchProgress.currentBatchFailed} fallidas
            </Badge>
            <Badge color="blue" size="lg">
              📊 {batchProgress.currentBatchImages} total
            </Badge>
          </Group>
        </Box>

        {/* Historial de Lotes */}
        {batchHistory.length > 0 && (
          <Box>
            <Text size="sm" fw={500} mb="xs">Historial de Lotes</Text>
            <Box style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Lote</Table.Th>
                    <Table.Th>Productos</Table.Th>
                    <Table.Th>Imágenes</Table.Th>
                    <Table.Th>Exitosas</Table.Th>
                    <Table.Th>Fallidas</Table.Th>
                    <Table.Th>Tasa Éxito</Table.Th>
                    <Table.Th>Tiempo</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {batchHistory.map((batch) => (
                    <Table.Tr key={batch.batchNumber}>
                      <Table.Td>{batch.batchNumber}</Table.Td>
                      <Table.Td>{batch.totalProducts}</Table.Td>
                      <Table.Td>{batch.totalImages}</Table.Td>
                      <Table.Td>
                        <Badge color="green" size="sm">
                          {batch.successfulImages}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="orange" size="sm">
                          {batch.failedImages}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={batch.successRate >= 50 ? 'green' : batch.successRate >= 25 ? 'yellow' : 'red'} 
                          size="sm"
                        >
                          {batch.successRate}%
                        </Badge>
                      </Table.Td>
                      <Table.Td>{batch.processingTime.toFixed(1)}s</Table.Td>
                      <Table.Td>
                        {batch.status === 'completed' && batch.successRate < 100 && (
                          <Button
                            size="xs"
                            variant="light"
                            color={batch.successRate < 30 ? 'red' : batch.successRate < 70 ? 'orange' : 'yellow'}
                            leftSection={<IconRefresh size="0.8rem" />}
                            onClick={() => reloadBatch(batch.batchNumber)}
                            disabled={false}
                            title={`Recargar lote ${batch.batchNumber} (${batch.successRate}% éxito)`}
                          >
                            {batch.successRate < 30 ? 'Recargar (Crítico)' : 
                             batch.successRate < 70 ? 'Recargar (Bajo)' : 'Recargar (Mejorar)'}
                          </Button>
                        )}
                        {batch.status === 'processing' && (
                          <Badge color="blue" size="sm">Procesando...</Badge>
                        )}
                        {batch.status === 'failed' && (
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            leftSection={<IconRefresh size="0.8rem" />}
                            onClick={() => reloadBatch(batch.batchNumber)}
                            disabled={false}
                            title={`Recargar lote ${batch.batchNumber} (Falló)`}
                          >
                            Recargar (Falló)
                          </Button>
                        )}
                        {batch.status === 'completed' && batch.successRate === 100 && (
                          <Badge color="green" size="sm">Perfecto</Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Resumen Final */}
        {showFinalSummary && (
          <Box>
            <Text size="lg" fw={500} mb="md">Resumen Final</Text>
            <Grid>
              <Grid.Col span={3}>
                <Card withBorder p="md">
                  <Text size="sm" fw={500} c="blue">Total Lotes</Text>
                  <Text size="xl" fw={700}>{batchHistory.length}</Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={3}>
                <Card withBorder p="md">
                  <Text size="sm" fw={500} c="green">Tasa Promedio</Text>
                  <Text size="xl" fw={700}>
                    {batchHistory.length > 0 
                      ? (batchHistory.reduce((sum, batch) => sum + batch.successRate, 0) / batchHistory.length).toFixed(1)
                      : 0}%
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={3}>
                <Card withBorder p="md">
                  <Text size="sm" fw={500} c="purple">Tiempo Total</Text>
                  <Text size="xl" fw={700}>
                    {batchHistory.reduce((sum, batch) => sum + batch.processingTime, 0).toFixed(1)}s
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={3}>
                <Card withBorder p="md">
                  <Text size="sm" fw={500} c="orange">Lotes No Perfectos</Text>
                  <Text size="xl" fw={700}>
                    {batchHistory.filter(batch => batch.successRate < 100).length}
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>
            
            {/* Análisis de Patrones */}
            <Box mt="md">
              <Text size="md" fw={500} mb="sm">Análisis de Patrones</Text>
              <Grid>
                <Grid.Col span={4}>
                  <Card withBorder p="sm">
                    <Text size="sm" fw={500} c="green">Lotes Perfectos (100%)</Text>
                    <Text size="lg" fw={600} c="green">
                      {batchHistory.filter(batch => batch.successRate === 100).length} / {batchHistory.length}
                    </Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card withBorder p="sm">
                    <Text size="sm" fw={500} c="yellow">Lotes Moderados (30-99%)</Text>
                    <Text size="lg" fw={600} c="yellow">
                      {batchHistory.filter(batch => batch.successRate >= 30 && batch.successRate < 100).length} / {batchHistory.length}
                    </Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card withBorder p="sm">
                    <Text size="sm" fw={500} c="red">Lotes Críticos (&lt;30%)</Text>
                    <Text size="lg" fw={600} c="red">
                      {batchHistory.filter(batch => batch.successRate < 30).length} / {batchHistory.length}
                    </Text>
                  </Card>
                </Grid.Col>
              </Grid>
              
              {/* Recomendaciones */}
              {batchHistory.filter(batch => batch.successRate < 100).length > 0 && (
                <Alert color="orange" variant="light" mt="md">
                  <Text size="sm">
                    <strong>Recomendación:</strong> Se detectaron {batchHistory.filter(batch => batch.successRate < 100).length} lotes que no alcanzaron 100% de éxito. 
                    Puedes usar los botones "Recargar" para intentar mejorar estos lotes con configuración optimizada.
                  </Text>
                  <Group mt="sm">
                    <Button
                      size="sm"
                      variant="light"
                      color="orange"
                      leftSection={<IconRefresh size="1rem" />}
                      onClick={() => {
                        const imperfectBatches = batchHistory.filter(batch => batch.successRate < 100);
                        imperfectBatches.forEach(batch => reloadBatch(batch.batchNumber));
                      }}
                      disabled={false}
                    >
                      Recargar Todos los No Perfectos
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="red"
                      leftSection={<IconRefresh size="1rem" />}
                      onClick={() => {
                        const criticalBatches = batchHistory.filter(batch => batch.successRate < 30);
                        criticalBatches.forEach(batch => reloadBatch(batch.batchNumber));
                      }}
                      disabled={false}
                    >
                      Recargar Solo Críticos (&lt;30%)
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="yellow"
                      leftSection={<IconRefresh size="1rem" />}
                      onClick={() => {
                        const moderateBatches = batchHistory.filter(batch => batch.successRate >= 30 && batch.successRate < 100);
                        moderateBatches.forEach(batch => reloadBatch(batch.batchNumber));
                      }}
                      disabled={false}
                    >
                      Recargar Moderados (30-99%)
                    </Button>
                  </Group>
                </Alert>
              )}
            </Box>
          </Box>
        )}

        <Alert color="blue" variant="light">
          <Text size="sm">
            <strong>Procesando por lotes de 100 productos</strong> para optimizar el rendimiento y evitar timeouts.
            {!showFinalSummary && " El proceso continuará automáticamente hasta completar todos los productos."}
            {showFinalSummary && " Procesamiento completado. Puedes recargar lotes con baja tasa de éxito."}
          </Text>
        </Alert>

        {/* Botón de cerrar cuando el procesamiento esté completo */}
        {showFinalSummary && (
          <Group justify="center" mt="md">
            {errorLogs.length > 0 && (
              <Button
                size="md"
                variant="outline"
                color="orange"
                leftSection={<IconDownload size="1rem" />}
                onClick={() => generateErrorLogFile(errorLogs)}
              >
                Descargar Log de Errores ({errorLogs.length} errores)
              </Button>
            )}
            <Button
              size="md"
              variant="filled"
              color="blue"
              onClick={() => setShowProgressModal(false)}
            >
              Cerrar Modal
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
    </>
  );
}

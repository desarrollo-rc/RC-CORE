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
  Select,
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
  const [tipoCliente, setTipoCliente] = useState<'fabrica' | 'dealer'>('fabrica');
  const [reloadingProducts, setReloadingProducts] = useState<Set<string>>(new Set());

  // Función helper para determinar el límite de imágenes basado en la cantidad de SKUs
  const getImageLimit = (skuCount: number): number => {
    return skuCount <= 500 ? 5 : 3;
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
  }>>([]);
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  const reloadBatch = async (batchNumber: number) => {
    if (!cotizacionData) return;
    
    const BATCH_SIZE = 100;
    const startIndex = (batchNumber - 1) * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, cotizacionData.items.length);
    const batchItems = cotizacionData.items.slice(startIndex, endIndex);
    
    console.log(`🔄 Reloading batch ${batchNumber} with ${batchItems.length} products`);
    
    // Marcar lote como procesando
    setBatchHistory(prev => prev.map(batch => 
      batch.batchNumber === batchNumber 
        ? { ...batch, status: 'processing' as const }
        : batch
    ));
    
    // Usar estrategia optimizada para recarga
    await processBatchOptimized(batchItems, batchNumber, Math.ceil(cotizacionData.items.length / BATCH_SIZE));
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
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => 
        urls.slice(0, imageLimit).map((url, index) => ({ sku, url, id: `${sku}_${index}` }))
      );
      
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
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean }>) => {
          const { id, sku, base64, error, isPlaceholder } = event.data;
          
          if (error && isPlaceholder) {
            console.warn(`🔄 Using placeholder for ${id}: ${error}`);
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
      workerResults.forEach(({ sku, base64 }) => {
        if (base64) {
          if (!imageMapBase64[sku]) {
            imageMapBase64[sku] = [];
          }
          imageMapBase64[sku].push(base64);
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
      
      // Actualizar historial con resultados optimizados
      const batchResult = {
        batchNumber,
        totalProducts: batchItems.length,
        totalImages,
        successfulImages,
        failedImages,
        successRate: parseFloat(successRate.toFixed(1)),
        processingTime: parseFloat(((performance.now() - startTime) / 1000).toFixed(2)),
        status: 'completed' as const
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

  const processImagesInBatches = async (items: CotizacionItem[]) => {
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    
    setBatchProcessing(true);
    setShowProgressModal(true);
    setBatchHistory([]);
    setShowFinalSummary(false);
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
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => 
        urls.slice(0, imageLimit).map((url, index) => ({ sku, url, id: `${sku}_${index}` }))
      );
      
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
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean }>) => {
          const { id, sku, base64, error, isPlaceholder } = event.data;
          
          if (error && isPlaceholder) {
            console.warn(`🔄 Using placeholder for ${id}: ${error}`);
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
      const batchSize = 5; // Procesar 5 imágenes a la vez (más rápido)
      for (let i = 0; i < allImageUrls.length; i += batchSize) {
        const batch = allImageUrls.slice(i, i + batchSize);
        
        // Distribuir batch entre workers
        batch.forEach((task, batchIndex) => {
          const workerIndex = (i + batchIndex) % workerCount;
          workers[workerIndex].postMessage(task);
        });
        
        // Pausa mínima entre batches
        if (i + batchSize < allImageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms entre batches
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
      workerResults.forEach(({ sku, base64 }) => {
        if (base64) {
          if (!imageMapBase64[sku]) {
            imageMapBase64[sku] = [];
          }
          imageMapBase64[sku].push(base64);
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
      
      // Agregar al historial de lotes
      const batchResult = {
        batchNumber,
        totalProducts: batchItems.length,
        totalImages,
        successfulImages,
        failedImages,
        successRate: parseFloat(successRate.toFixed(1)),
        processingTime: parseFloat(totalSeconds),
        status: 'completed' as const
      };
      
      setBatchHistory(prev => [...prev, batchResult]);
      
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
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => 
        urls.slice(0, imageLimit).map((url, index) => ({ sku, url, id: `${sku}_${index}` }))
      );
      
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
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean }>) => {
          const { id, sku, base64, error, isPlaceholder } = event.data;
          
          if (error) {
            if (isPlaceholder) {
              console.warn(`🔄 Using placeholder for ${id}: ${error}`);
            } else {
              console.warn(`❌ Worker error for ${id}:`, error);
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
      const batchSize = 5; // Procesar 5 imágenes a la vez (más rápido)
      for (let i = 0; i < allImageUrls.length; i += batchSize) {
        const batch = allImageUrls.slice(i, i + batchSize);
        
        // Distribuir batch entre workers
        batch.forEach((task, batchIndex) => {
          const workerIndex = (i + batchIndex) % workerCount;
          workers[workerIndex].postMessage(task);
        });
        
        // Pausa mínima entre batches
        if (i + batchSize < allImageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms entre batches
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
      workerResults.forEach(({ sku, base64 }) => {
        if (base64) {
          if (!imageMapBase64[sku]) {
            imageMapBase64[sku] = [];
          }
          imageMapBase64[sku].push(base64);
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
        
        worker.onmessage = (event: MessageEvent<{ id: string; sku: string; base64: string | null; error?: string; isPlaceholder?: boolean }>) => {
          const { id, sku, base64, error, isPlaceholder } = event.data;
          
          if (error && isPlaceholder) {
            console.warn(`🔄 Using placeholder for ${id}: ${error}`);
            failedImages++;
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

        // Determinar estructura según tipo de cliente
        const isFabrica = tipoCliente === 'fabrica';
        const minColumns = isFabrica ? 12 : 16;

        console.log(`📊 Processing Excel with ${jsonData.length} rows (including header)`);
        console.log(`📊 Client type: ${tipoCliente}, Min columns required: ${minColumns}`);

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

            let pedido: number;
            let precio: number;

            if (isFabrica) {
              // Formato Fábrica: Pedido en col 9, FOB en col 10
              pedido = parseFloat(getValue(9, 0)) || 0;
              precio = parseFloat(getValue(10, 0)) || 0;
            } else {
              // Formato Dealer: Ped. Sug. en col 10, no hay precio directo
              // Para Dealer usamos Ped. Sug. como cantidad y el precio será 0 por ahora
              pedido = parseFloat(getValue(10, 0)) || 0;
              precio = 0; // Dealer no tiene FOB en la estructura actual
            }

            const subtotal = pedido * precio;

            // Validación más flexible: solo requiere SKU y descripción
            if (numeroArticulo && descripcionArticulo) {
              items.push({
                numero_articulo: numeroArticulo,
                descripcion_articulo: descripcionArticulo,
                nombre_extranjero: getValue(2, ''),
                nombre_chino: getValue(3, ''),
                marca: getValue(4, ''),
                modelo: isFabrica ? getValue(5, '') : getValue(6, ''),
                modelo_chino: isFabrica ? getValue(6, '') : getValue(7, ''),
                volumen_unidad_compra: isFabrica ? parseFloat(getValue(7, 0)) || 0 : parseFloat(getValue(8, 0)) || 0,
                oem_part: isFabrica ? getValue(8, '') : getValue(9, ''),
                pedido: pedido,
                fob: precio,
                last_fob: isFabrica ? parseFloat(getValue(11, 0)) || 0 : 0,
                // Campos específicos de Dealer
                ...(isFabrica ? {} : {
                  cod_mod: getValue(5, ''),
                  tg: getValue(11, ''),
                  com_tecnico: getValue(12, ''),
                  errores: getValue(13, ''),
                  volumen_dealer: parseFloat(getValue(14, 0)) || 0,
                  supplier: getValue(15, ''),
                }),
                subtotal: subtotal,
                observaciones: '',
                imagenes: [], // Empezamos con array vacío
              });
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
          tipoCliente: tipoCliente,
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
            if (items.length > 100) {
              // Usar procesamiento por lotes para archivos grandes
              processImagesInBatches(items);
            } else {
              // Usar procesamiento normal para archivos pequeños
              fetchAndSetRealImages(items);
            }

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
  }, [fetchAndSetRealImages, tipoCliente]); // <-- Incluir tipoCliente en dependencias

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
        {/* Selección de Tipo de Cliente */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={500}>Tipo de Cliente</Text>
            <Select
              label="Selecciona el tipo de cliente"
              placeholder="Elige Fábrica o Dealer"
              data={[
                { value: 'fabrica', label: 'Fábrica' },
                { value: 'dealer', label: 'Dealer' }
              ]}
              value={tipoCliente}
              onChange={(value) => setTipoCliente(value as 'fabrica' | 'dealer')}
              searchable
              clearable={false}
              description={
                tipoCliente === 'fabrica'
                  ? 'Se usará el formato estándar de cotización'
                  : 'Se usará el formato de cotización para Dealer'
              }
            />
          </Stack>
        </Paper>

        {/* Sección de carga de archivo */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={500}>Cargar Archivo Excel</Text>
            <Text size="sm" c="dimmed">
              Arrastra y suelta un archivo Excel (.xlsx, .xls) o haz clic para seleccionar.
              El archivo debe tener las columnas: Número de artículo, Descripción del artículo, Nombre extranjero, Nombre en Chino, Marca, Modelo, Modelo en Chino, Volumen - Unidad de compra, OEM Part, Pedido, FOB, Last FOB.
              <br /><strong>Nota:</strong> Se agregará automáticamente una imagen por defecto a cada producto.
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
                            fetchAndSetRealImages(cotizacionData.items);
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
                      <Table.Th style={{ minWidth: '100px' }}>SKU</Table.Th>
                      <Table.Th style={{ minWidth: '150px' }}>Descripción</Table.Th>
                      <Table.Th style={{ minWidth: '120px' }}>Nombre Extranjero</Table.Th>
                      <Table.Th style={{ minWidth: '120px' }}>Nombre Chino</Table.Th>
                      <Table.Th style={{ minWidth: '100px' }}>Marca</Table.Th>
                      {cotizacionData?.tipoCliente === 'dealer' && (
                        <Table.Th style={{ minWidth: '80px' }}>Cod Mod</Table.Th>
                      )}
                      <Table.Th style={{ minWidth: '130px' }}>Modelo</Table.Th>
                      <Table.Th style={{ minWidth: '130px' }}>Modelo Chino</Table.Th>
                      <Table.Th style={{ minWidth: '100px' }}>Volumen</Table.Th>
                      <Table.Th style={{ minWidth: '100px' }}>OEM Part</Table.Th>
                      <Table.Th style={{ minWidth: '80px' }}>Pedido</Table.Th>
                      {cotizacionData?.tipoCliente === 'fabrica' && (
                        <>
                          <Table.Th style={{ minWidth: '100px' }}>FOB</Table.Th>
                          <Table.Th style={{ minWidth: '100px' }}>Last FOB</Table.Th>
                        </>
                      )}
                      {cotizacionData?.tipoCliente === 'dealer' && (
                        <>
                          <Table.Th style={{ minWidth: '80px' }}>TG</Table.Th>
                          <Table.Th style={{ minWidth: '120px' }}>Com Técnico</Table.Th>
                          <Table.Th style={{ minWidth: '100px' }}>Errores</Table.Th>
                          <Table.Th style={{ minWidth: '120px' }}>Volumen</Table.Th>
                          <Table.Th style={{ minWidth: '120px' }}>Supplier</Table.Th>
                        </>
                      )}
                          <Table.Th style={{ minWidth: '200px' }}>Imágenes</Table.Th>
                          <Table.Th style={{ minWidth: '100px' }}>Acciones</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {cotizacionData.items.map((item, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{item.numero_articulo}</Table.Td>
                            <Table.Td>{item.descripcion_articulo}</Table.Td>
                            <Table.Td>{item.nombre_extranjero}</Table.Td>
                            <Table.Td>{item.nombre_chino}</Table.Td>
                            <Table.Td>{item.marca}</Table.Td>
                            {cotizacionData?.tipoCliente === 'dealer' && (
                              <Table.Td>{item.cod_mod}</Table.Td>
                            )}
                            <Table.Td>{item.modelo}</Table.Td>
                            <Table.Td>{item.modelo_chino}</Table.Td>
                            <Table.Td>{item.volumen_unidad_compra}</Table.Td>
                            <Table.Td>{item.oem_part}</Table.Td>
                            <Table.Td>{item.pedido}</Table.Td>
                            {cotizacionData?.tipoCliente === 'fabrica' && (
                              <>
                                <Table.Td>${item.fob.toLocaleString()}</Table.Td>
                                <Table.Td>${item.last_fob.toLocaleString()}</Table.Td>
                              </>
                            )}
                            {cotizacionData?.tipoCliente === 'dealer' && (
                              <>
                                <Table.Td>{item.tg}</Table.Td>
                                <Table.Td>{item.com_tecnico}</Table.Td>
                                <Table.Td>{item.errores}</Table.Td>
                                <Table.Td>{item.volumen_dealer}</Table.Td>
                                <Table.Td>{item.supplier}</Table.Td>
                              </>
                            )}
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                {item.imagenes && item.imagenes.map((imagen, imgIndex) => (
                                  <Box key={imgIndex} style={{ position: 'relative' }}>
                                    <ProductImage
                                      src={imagen}
                                      alt={`Imagen ${imgIndex + 1}`}
                                      numeroArticulo={`${item.numero_articulo} - Img ${imgIndex + 1}`}
                                      size={35}
                                      todasLasImagenes={item.imagenes}
                                      showDeleteButton={true}
                                      onDelete={(index) => removeImageFromProduct(item.numero_articulo, index)}
                                    />
                                  </Box>
                                ))}
                              </Group>
                            </Table.Td>
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
          title={`Formato del archivo Excel - ${tipoCliente === 'fabrica' ? 'Fábrica' : 'Dealer'}`}
          color="blue"
          variant="light"
        >
          <Text size="sm">
            El archivo Excel debe tener las siguientes columnas en la primera fila:
          </Text>
          <Text size="sm" mt="xs">
            {tipoCliente === 'fabrica' ? (
              <>
                <strong>Columna A:</strong> Número de artículo<br />
                <strong>Columna B:</strong> Descripción del artículo<br />
                <strong>Columna C:</strong> Nombre extranjero<br />
                <strong>Columna D:</strong> Nombre en Chino<br />
                <strong>Columna E:</strong> Marca<br />
                <strong>Columna F:</strong> Modelo<br />
                <strong>Columna G:</strong> Modelo en Chino<br />
                <strong>Columna H:</strong> Volumen - Unidad de compra<br />
                <strong>Columna I:</strong> OEM Part<br />
                <strong>Columna J:</strong> Pedido<br />
                <strong>Columna K:</strong> FOB<br />
                <strong>Columna L:</strong> Last FOB
              </>
            ) : (
              <>
                <strong>Columna A:</strong> Artículo (SKU)<br />
                <strong>Columna B:</strong> Descripción<br />
                <strong>Columna C:</strong> Nombre extranjero<br />
                <strong>Columna D:</strong> Nombre en chino<br />
                <strong>Columna E:</strong> Marca<br />
                <strong>Columna F:</strong> Cod mod<br />
                <strong>Columna G:</strong> Modelo<br />
                <strong>Columna H:</strong> Modelo chino<br />
                <strong>Columna I:</strong> Volúmen<br />
                <strong>Columna J:</strong> OEM<br />
                <strong>Columna K:</strong> Ped. Sug.<br />
                <strong>Columna L:</strong> TG<br />
                <strong>Columna M:</strong> Com técnico<br />
                <strong>Columna N:</strong> Errores<br />
                <strong>Columna O:</strong> Volumen<br />
                <strong>Columna P:</strong> SUPPLIER
              </>
            )}
          </Text>
          <Text size="sm" mt="md" c="dimmed">
            <strong>Imágenes:</strong> Se cargarán automáticamente según el SKU del producto.
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

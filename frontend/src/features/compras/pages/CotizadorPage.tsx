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
  Select
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconTrash
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
      const { imageUrlToBase64 } = await import('../../../utils/imageUtils');

      // Convertir TODAS las URLs a Base64 aquí mismo, para que Excel no tenga que hacerlo
      const imageMapBase64: Record<string, string[]> = {};
      
      // Procesar TODAS las imágenes en paralelo (máxima velocidad)
      const allImageUrls = Object.entries(imageMap).flatMap(([sku, urls]) => 
        urls.map(url => ({ sku, url }))
      );
      
      console.log(`🔄 Converting ${allImageUrls.length} images to Base64 in parallel...`);
      
      // Procesar TODAS las imágenes simultáneamente
      const allPromises = allImageUrls.map(async ({ sku, url }) => {
        try {
          const base64 = await imageUrlToBase64(url);
          return { sku, base64 };
        } catch (error) {
          console.warn(`Failed to convert image to Base64 for ${url}:`, error);
          return { sku, base64: null };
        }
      });
      
      // Esperar a que terminen TODAS las conversiones
      const allResults = await Promise.all(allPromises);
      
      // Agrupar resultados por SKU
      allResults.forEach(({ sku, base64 }) => {
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
      
      console.log(`✅ All images loaded successfully!`);
      console.log(`⏱️  Total time: ${totalSeconds}s`);
      console.log(`📊 Performance: ${imagesPerSecond} images/second`);
      console.log(`📈 Breakdown:`);
      console.log(`   📥 URL fetch: ${(fetchTime - startTime).toFixed(2)}ms`);
      console.log(`   🔄 Base64 conversion: ${(conversionTime - fetchTime).toFixed(2)}ms`);
      console.log(`   💾 State update: ${(totalTime - conversionTime).toFixed(2)}ms`);

      notifications.show({
        title: 'Imágenes cargadas',
        message: `Se han cargado y procesado todas las imágenes en ${totalSeconds}s (${imagesPerSecond} img/s). Ya está listo para exportar.`,
        color: 'blue',
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

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= minColumns) {
            const numeroArticulo = row[0]?.toString() || '';
            const descripcionArticulo = row[1]?.toString() || '';

            let pedido: number;
            let precio: number;

            if (isFabrica) {
              // Formato Fábrica: Pedido en col 9, FOB en col 10
              pedido = parseFloat(row[9]) || 0;
              precio = parseFloat(row[10]) || 0;
            } else {
              // Formato Dealer: Ped. Sug. en col 10, no hay precio directo
              // Para Dealer usamos Ped. Sug. como cantidad y el precio será 0 por ahora
              pedido = parseFloat(row[10]) || 0;
              precio = 0; // Dealer no tiene FOB en la estructura actual
            }

            const subtotal = pedido * precio;

            if (numeroArticulo && descripcionArticulo && pedido > 0) {
              items.push({
                numero_articulo: numeroArticulo,
                descripcion_articulo: descripcionArticulo,
                nombre_extranjero: row[2]?.toString() || '',
                nombre_chino: row[3]?.toString() || '',
                marca: row[4]?.toString() || '',
                modelo: isFabrica ? row[5]?.toString() || '' : row[6]?.toString() || '',
                modelo_chino: isFabrica ? row[6]?.toString() || '' : row[7]?.toString() || '',
                volumen_unidad_compra: isFabrica ? parseFloat(row[7]) || 0 : parseFloat(row[8]) || 0,
                oem_part: isFabrica ? row[8]?.toString() || '' : row[9]?.toString() || '',
                pedido: pedido,
                fob: precio,
                last_fob: isFabrica ? parseFloat(row[11]) || 0 : 0,
                // Campos específicos de Dealer
                ...(isFabrica ? {} : {
                  cod_mod: row[5]?.toString() || '',
                  tg: row[11]?.toString() || '',
                  com_tecnico: row[12]?.toString() || '',
                  errores: row[13]?.toString() || '',
                  volumen_dealer: parseFloat(row[14]) || 0,
                  supplier: row[15]?.toString() || '',
                }),
                subtotal: subtotal,
                observaciones: '',
                imagenes: [], // Empezamos con array vacío
              });
              totalEstimado += subtotal;
            }
          }
        }

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
        fetchAndSetRealImages(items);

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
                            {[0, 1, 2, 3, 4].map((imgIndex) => (
                              item.imagenes && item.imagenes[imgIndex] ? (
                                <ProductImage
                                  key={imgIndex}
                                  src={item.imagenes[imgIndex]}
                                  alt={`Imagen ${imgIndex + 1}`}
                                  numeroArticulo={`${item.numero_articulo} - Img ${imgIndex + 1}`}
                                  size={35}
                                  todasLasImagenes={item.imagenes}
                                />
                              ) : null
                            ))}
                          </Group>
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
  );
}

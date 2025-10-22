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
  Loader
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
import logoRC from '../../../assets/logoRC.jpeg';
import logoRC2 from '../../../assets/RC.png';
import { ProductImage } from '../components';
import { exportarCotizacionConImagenes } from '../../../utils';

export function CotizadorPage() {
  const [cotizacionData, setCotizacionData] = useState<CotizacionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [nombreCotizacion, setNombreCotizacion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    
    // Simular procesamiento del archivo
    setTimeout(() => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Procesar los datos del Excel según el formato de Meitong
            const items: CotizacionItem[] = [];
            let totalEstimado = 0;

            // Procesar desde la segunda fila (primera fila son headers)
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              if (row && row.length >= 12) {
                const numeroArticulo = row[0]?.toString() || '';
                const descripcionArticulo = row[1]?.toString() || '';
                const nombreExtranjero = row[2]?.toString() || '';
                const nombreChino = row[3]?.toString() || '';
                const marca = row[4]?.toString() || '';
                const modelo = row[5]?.toString() || '';
                const modeloChino = row[6]?.toString() || '';
                const volumenUnidadCompra = parseFloat(row[7]) || 0;
                const oemPart = row[8]?.toString() || '';
                const pedido = parseFloat(row[9]) || 0;
                const fob = parseFloat(row[10]) || 0;
                const lastFob = parseFloat(row[11]) || 0;

                // Calcular subtotal basado en pedido y FOB
                const subtotal = pedido * fob;

                if (numeroArticulo && descripcionArticulo && pedido > 0) {
                  // Crear array de hasta 5 imágenes alternando entre las dos disponibles
                  const imagenes = [];
                  for (let i = 0; i < 5; i++) {
                    imagenes.push(i % 2 === 0 ? logoRC : logoRC2);
                  }
                  
                  items.push({
                    numero_articulo: numeroArticulo,
                    descripcion_articulo: descripcionArticulo,
                    nombre_extranjero: nombreExtranjero,
                    nombre_chino: nombreChino,
                    marca: marca,
                    modelo: modelo,
                    modelo_chino: modeloChino,
                    volumen_unidad_compra: volumenUnidadCompra,
                    oem_part: oemPart,
                    pedido: pedido,
                    fob: fob,
                    last_fob: lastFob,
                    subtotal: subtotal,
                    observaciones: '',
                    imagenes: imagenes
                  });
                  totalEstimado += subtotal;
                }
              }
            }

            const result: CotizacionData = {
              items,
              total_items: items.length,
              total_estimado: totalEstimado
            };

            setCotizacionData(result);
            setNombreCotizacion(file.name.replace(/\.[^/.]+$/, ""));
            
            notifications.show({
              title: 'Archivo cargado exitosamente',
              message: `Se procesaron ${items.length} items del archivo ${file.name}`,
              color: 'green',
              icon: <IconCheck size="1rem" />
            });
          } catch (error) {
            console.error('Error procesando Excel:', error);
            notifications.show({
              title: 'Error al procesar el archivo',
              message: 'El archivo Excel no pudo ser procesado correctamente',
              color: 'red',
              icon: <IconAlertCircle size="1rem" />
            });
          } finally {
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error leyendo archivo:', error);
        notifications.show({
          title: 'Error al leer el archivo',
          message: 'No se pudo leer el archivo seleccionado',
          color: 'red',
          icon: <IconAlertCircle size="1rem" />
        });
        setLoading(false);
      }
    }, 1000);
  }, []);

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
      
      // Usar la nueva función de exportación con ExcelJS
      await exportarCotizacionConImagenes(cotizacionData, nombreCotizacion || 'cotizacion_export');
      
      notifications.show({
        title: 'Excel exportado exitosamente',
        message: `Se exportaron ${cotizacionData.items.length} productos con imágenes reales`,
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

  return (
    <Box>
      <Title order={2} mb="xl">Cotizador</Title>
      
      <Stack gap="lg">
        {/* Sección de carga de archivo */}
        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={500}>Cargar Archivo Excel</Text>
            <Text size="sm" c="dimmed">
              Arrastra y suelta un archivo Excel (.xlsx, .xls) o haz clic para seleccionar.
              El archivo debe tener las columnas: Número de artículo, Descripción del artículo, Nombre extranjero, Nombre en Chino, Marca, Modelo, Modelo en Chino, Volumen - Unidad de compra, OEM Part, Pedido, FOB, Last FOB.
              <br/><strong>Nota:</strong> Se agregará automáticamente una imagen por defecto a cada producto.
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
                    leftSection={loading ? <Loader size="1rem" /> : <IconDownload size="1rem" />}
                    onClick={handleExportar}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Exportando...' : 'Exportar'}
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
              
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Número Artículo</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th>Marca</Table.Th>
                    <Table.Th>Modelo</Table.Th>
                    <Table.Th>OEM Part</Table.Th>
                    <Table.Th>Pedido</Table.Th>
                    <Table.Th>FOB</Table.Th>
                    <Table.Th>Last FOB</Table.Th>
                    <Table.Th>Imagen 1</Table.Th>
                    <Table.Th>Imagen 2</Table.Th>
                    <Table.Th>Imagen 3</Table.Th>
                    <Table.Th>Imagen 4</Table.Th>
                    <Table.Th>Imagen 5</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {cotizacionData.items.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.numero_articulo}</Table.Td>
                      <Table.Td>{item.descripcion_articulo}</Table.Td>
                      <Table.Td>{item.marca}</Table.Td>
                      <Table.Td>{item.modelo}</Table.Td>
                      <Table.Td>{item.oem_part}</Table.Td>
                      <Table.Td>{item.pedido}</Table.Td>
                      <Table.Td>${item.fob.toLocaleString()}</Table.Td>
                      <Table.Td>${item.last_fob.toLocaleString()}</Table.Td>
                      {[0, 1, 2, 3, 4].map((imgIndex) => (
                        <Table.Td key={imgIndex}>
                          {item.imagenes && item.imagenes[imgIndex] ? (
                            <ProductImage
                              src={item.imagenes[imgIndex]}
                              alt={`Imagen ${imgIndex + 1} de ${item.numero_articulo}`}
                              numeroArticulo={`${item.numero_articulo} - Imagen ${imgIndex + 1}`}
                              size={40}
                              todasLasImagenes={item.imagenes}
                            />
                          ) : (
                            <Text size="sm" c="dimmed">-</Text>
                          )}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Paper>
        )}

        {/* Información de ayuda */}
        <Alert
          icon={<IconFileSpreadsheet size="1rem" />}
          title="Formato del archivo Excel"
          color="blue"
          variant="light"
        >
          <Text size="sm">
            El archivo Excel debe tener las siguientes columnas en la primera fila:
          </Text>
          <Text size="sm" mt="xs">
            <strong>Columna A:</strong> Número de artículo<br/>
            <strong>Columna B:</strong> Descripción del artículo<br/>
            <strong>Columna C:</strong> Nombre extranjero<br/>
            <strong>Columna D:</strong> Nombre en Chino<br/>
            <strong>Columna E:</strong> Marca<br/>
            <strong>Columna F:</strong> Modelo<br/>
            <strong>Columna G:</strong> Modelo en Chino<br/>
            <strong>Columna H:</strong> Volumen - Unidad de compra<br/>
            <strong>Columna I:</strong> OEM Part<br/>
            <strong>Columna J:</strong> Pedido<br/>
            <strong>Columna K:</strong> FOB<br/>
            <strong>Columna L:</strong> Last FOB
          </Text>
          <Text size="sm" mt="md" c="dimmed">
            <strong>Imágenes:</strong> Se agregará automáticamente una imagen por defecto (logo RC) a cada producto en la cotización.
          </Text>
        </Alert>
      </Stack>
    </Box>
  );
}

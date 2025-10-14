// frontend/src/features/pedidos/pages/GmailReviewPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Table,
    Checkbox,
    Badge,
    Accordion,
    Alert,
    Paper,
    ActionIcon,
    TextInput,
    NumberInput,
    Center,
    Divider,
    Switch,
    ScrollArea,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
    IconCheck,
    IconAlertCircle,
    IconAlertTriangle,
    IconTrash,
    IconChevronLeft,
    IconUpload,
    IconFileText,
    IconInfoCircle,
} from '@tabler/icons-react';
import type { PedidoPreview } from '../services/pedidoService';
import { procesarPedidosGmail } from '../services/pedidoService';
import { descargarPDFGmail, descargarArchivo } from '../services/archivoService';

export function GmailReviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [pedidos, setPedidos] = useState<PedidoPreview[]>([]);
    const [loading, setLoading] = useState(false);
    const [crearClientes, setCrearClientes] = useState(true);
    const [crearProductos, setCrearProductos] = useState(true);
    const initializedRef = useRef(false);

    const handleTogglePedido = useCallback((pedidoIndex: number) => {
        setPedidos(prev => {
            const pedido = prev[pedidoIndex];
            
            if ((pedido.estado_validacion === 'error' || pedido.estado_validacion === 'cargado') && !pedido.seleccionado) {
                notifications.show({
                    title: 'No se puede seleccionar',
                    message: pedido.estado_validacion === 'cargado' 
                        ? 'Este pedido ya está cargado en el sistema'
                        : 'Este pedido tiene errores que deben corregirse primero',
                    color: 'orange',
                });
                return prev;
            }
            
            return prev.map((p, idx) => 
                idx === pedidoIndex 
                    ? { ...p, seleccionado: !p.seleccionado }
                    : p
            );
        });
    }, []);

    useEffect(() => {
        // Prevenir doble inicialización en React Strict Mode
        if (initializedRef.current) {
            return;
        }
        
        // Recibir los pedidos desde el estado de navegación
        if (location.state?.pedidos) {
            setPedidos(location.state.pedidos);
            initializedRef.current = true;
        } else {
            // Si no hay datos, redirigir a la página de pedidos
            notifications.show({
                title: 'Error',
                message: 'No hay pedidos para revisar',
                color: 'red',
            });
            navigate('/pedidos');
        }
    }, [location.state?.pedidos, navigate]);


    const handleToggleAll = () => {
        const pedidosSeleccionables = pedidos.filter(p => p.estado_validacion !== 'error' && p.estado_validacion !== 'cargado');
        const todosSeleccionados = pedidosSeleccionables.every(p => p.seleccionado);
        
        setPedidos(prev => prev.map(p => ({
            ...p,
            seleccionado: (p.estado_validacion === 'error' || p.estado_validacion === 'cargado') ? false : !todosSeleccionados
        })));
    };

    const handleEliminarPedido = (index: number) => {
        setPedidos(prev => prev.filter((_, i) => i !== index));
    };

    const handleEliminarProducto = (pedidoIndex: number, productoIndex: number) => {
        setPedidos(prev => {
            const updated = [...prev];
            updated[pedidoIndex].productos = updated[pedidoIndex].productos.filter((_, i) => i !== productoIndex);
            
            // Actualizar advertencias si ya no hay productos faltantes
            if (updated[pedidoIndex].productos.length === 0) {
                updated[pedidoIndex].advertencias = [...updated[pedidoIndex].advertencias, 'No hay productos en este pedido'];
                updated[pedidoIndex].estado_validacion = 'error';
                updated[pedidoIndex].seleccionado = false;
            }
            
            return updated;
        });
    };

    const handleUpdateClienteInfo = (index: number, field: string, value: string) => {
        setPedidos(prev => {
            const updated = [...prev];
            updated[index].info_cliente = {
                ...updated[index].info_cliente,
                [field]: value
            };
            return updated;
        });
    };

    const handleUpdateProducto = (pedidoIndex: number, productoIndex: number, field: string, value: any) => {
        setPedidos(prev => {
            const updated = [...prev];
            updated[pedidoIndex].productos[productoIndex] = {
                ...updated[pedidoIndex].productos[productoIndex],
                [field]: value
            };
            return updated;
        });
    };

    const handleDescargarPDF = async (rutaPdf: string, codigoB2B: string) => {
        try {
            // Extraer la ruta relativa del path completo
            const rutaRelativa = rutaPdf.split('gmail_pdfs/')[1];
            
            notifications.show({
                id: 'descargando-pdf',
                title: 'Descargando PDF',
                message: 'Preparando descarga del archivo...',
                loading: true,
                autoClose: false,
            });

            const blob = await descargarPDFGmail(rutaRelativa);
            descargarArchivo(blob, `${codigoB2B}.pdf`);

            notifications.update({
                id: 'descargando-pdf',
                title: 'Descarga Completada',
                message: `PDF ${codigoB2B} descargado exitosamente`,
                color: 'green',
                loading: false,
                autoClose: 3000,
            });
        } catch (error: any) {
            notifications.update({
                id: 'descargando-pdf',
                title: 'Error en Descarga',
                message: error.response?.data?.mensaje || 'Error al descargar el PDF',
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        }
    };

    const handleProcesar = async () => {
        const pedidosSeleccionados = pedidos.filter(p => p.seleccionado);
        
        if (pedidosSeleccionados.length === 0) {
            notifications.show({
                title: 'Error',
                message: 'Debe seleccionar al menos un pedido',
                color: 'red',
            });
            return;
        }

        setLoading(true);
        try {
            const resultado = await procesarPedidosGmail(
                pedidosSeleccionados,
                crearClientes,
                crearProductos
            );

            if (resultado.exito) {
                const pedidosCreados = resultado.pedidos_creados?.length || 0;
                const clientesCreados = resultado.clientes_creados?.length || 0;
                const productosCreados = resultado.productos_creados?.length || 0;
                const errores = resultado.errores?.length || 0;

                // Modal con resumen detallado
                modals.open({
                    title: 'Resultado del Procesamiento',
                    size: 'xl',
                    children: (
                        <Stack>
                            {pedidosCreados > 0 && (
                                <Alert color="green" icon={<IconCheck size={16} />}>
                                    <Text fw={500}>✅ {pedidosCreados} pedido(s) creado(s)</Text>
                                    {resultado.pedidos_creados?.map((p: any) => (
                                        <Text key={p.codigo_b2b} size="sm" c="dimmed">
                                            • {p.codigo_b2b}
                                            {p.es_duplicado_diferente && p.codigo_b2b_final && (
                                                <Text component="span" c="orange" fw={500}>
                                                    {' '}→ {p.codigo_b2b_final}
                                                </Text>
                                            )}
                                            : {p.productos_count} productos
                                        </Text>
                                    ))}
                                </Alert>
                            )}

                            {clientesCreados > 0 && (
                                <Alert color="blue">
                                    <Text fw={500}>👤 {clientesCreados} cliente(s) nuevo(s)</Text>
                                    {resultado.clientes_creados?.map((c: any) => (
                                        <Text key={c.id_cliente} size="sm" c="dimmed">
                                            • {c.rut} - {c.nombre}
                                        </Text>
                                    ))}
                                </Alert>
                            )}

                            {productosCreados > 0 && (
                                <Alert color="cyan">
                                    <Text fw={500}>📦 {productosCreados} producto(s) nuevo(s)</Text>
                                    {resultado.productos_creados?.map((p: any) => (
                                        <Text key={p.id_producto} size="sm" c="dimmed">
                                            • {p.sku} - {p.nombre}
                                        </Text>
                                    ))}
                                </Alert>
                            )}

                            {errores > 0 && (
                                <Alert color="red" icon={<IconAlertCircle size={16} />}>
                                    <Text fw={500}>❌ {errores} error(es) encontrado(s)</Text>
                                    <Stack gap="xs" mt="md">
                                        {resultado.errores?.map((error: any, idx: number) => (
                                            <Box key={idx} p="xs" style={{ backgroundColor: 'rgba(255,0,0,0.05)', borderRadius: '4px' }}>
                                                <Group justify="space-between" mb="xs">
                                                    <Text size="sm" fw={500}>
                                                        {error.codigo_b2b || 'General'} {error.tipo && `[${error.tipo}]`} {error.sku && `(${error.sku})`}
                                                    </Text>
                                                    <Button 
                                                        size="compact-xs" 
                                                        variant="light"
                                                        onClick={() => {
                                                            const fullError = `Código: ${error.codigo_b2b || 'N/A'}\nTipo: ${error.tipo || 'N/A'}\nMensaje: ${error.mensaje}\n\nDetalle:\n${error.detalle || 'Sin detalle'}`;
                                                            navigator.clipboard.writeText(fullError);
                                                            notifications.show({
                                                                message: 'Error copiado al portapapeles',
                                                                color: 'green'
                                                            });
                                                        }}
                                                    >
                                                        Copiar
                                                    </Button>
                                                </Group>
                                                <Text size="xs" c="red">
                                                    {error.mensaje}
                                                </Text>
                                                {error.detalle && (
                                                    <Text size="xs" c="dimmed" mt="xs" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                                        {error.detalle.split('\n').slice(0, 3).join('\n')}...
                                                    </Text>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Alert>
                            )}

                            <Group justify="flex-end" mt="md">
                                <Button onClick={() => {
                                    modals.closeAll();
                                    if (pedidosCreados > 0) {
                                        navigate('/pedidos');
                                    }
                                }}>
                                    {pedidosCreados > 0 ? 'Ir a Pedidos' : 'Cerrar'}
                                </Button>
                            </Group>
                        </Stack>
                    )
                });

                // Notificación corta
                notifications.show({
                    title: 'Procesamiento Completado',
                    message: resultado.mensaje,
                    color: errores > 0 ? 'yellow' : 'green',
                    icon: errores > 0 ? <IconAlertTriangle size={18} /> : <IconCheck size={18} />,
                });
            } else {
                notifications.show({
                    title: 'Error en el Procesamiento',
                    message: resultado.mensaje,
                    color: 'red',
                    icon: <IconAlertCircle size={18} />,
                });
            }
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.mensaje || 'Error al procesar pedidos',
                color: 'red',
                icon: <IconAlertCircle size={18} />,
            });
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'valido':
                return <Badge color="green" leftSection={<IconCheck size={14} />}>Válido</Badge>;
            case 'advertencia':
                return <Badge color="yellow" leftSection={<IconAlertTriangle size={14} />}>Advertencia</Badge>;
            case 'error':
                return <Badge color="red" leftSection={<IconAlertCircle size={14} />}>Error</Badge>;
            case 'cargado':
                return <Badge color="blue" leftSection={<IconCheck size={14} />}>Cargado</Badge>;
            default:
                return <Badge color="gray">Desconocido</Badge>;
        }
    };

    const pedidosSeleccionados = pedidos.filter(p => p.seleccionado).length;
    const totalPedidos = pedidos.length;

    if (pedidos.length === 0 && !loading) {
        return (
            <Center h={400}>
                <Stack align="center">
                    <IconInfoCircle size={48} />
                    <Text>No hay pedidos para revisar</Text>
                    <Button onClick={() => navigate('/pedidos')}>Volver a Pedidos</Button>
                </Stack>
            </Center>
        );
    }

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Group>
                    <ActionIcon variant="subtle" onClick={() => navigate('/pedidos')}>
                        <IconChevronLeft size={20} />
                    </ActionIcon>
                    <div>
                        <Title order={2}>Revisar Pedidos Extraídos de Gmail</Title>
                        <Text size="sm" c="dimmed">
                            Revisa y selecciona los pedidos que deseas cargar en el sistema
                        </Text>
                    </div>
                </Group>
                <Group>
                    <Badge size="lg" variant="light">
                        {pedidosSeleccionados} / {totalPedidos} seleccionados
                    </Badge>
                    <Button
                        leftSection={<IconUpload size={16} />}
                        onClick={handleProcesar}
                        loading={loading}
                        disabled={pedidosSeleccionados === 0}
                    >
                        Iniciar Carga
                    </Button>
                </Group>
            </Group>

            <Paper shadow="xs" p="md" mb="md">
                <Group justify="space-between">
                    <Group>
                        <Switch
                            label="Crear clientes nuevos automáticamente"
                            checked={crearClientes}
                            onChange={(e) => setCrearClientes(e.currentTarget.checked)}
                        />
                        <Switch
                            label="Crear productos nuevos automáticamente"
                            checked={crearProductos}
                            onChange={(e) => setCrearProductos(e.currentTarget.checked)}
                        />
                    </Group>
                    <Button variant="outline" size="sm" onClick={handleToggleAll}>
                        {pedidos.filter(p => p.estado_validacion !== 'error' && p.estado_validacion !== 'cargado').every(p => p.seleccionado)
                            ? 'Deseleccionar Todos'
                            : 'Seleccionar Todos los Disponibles'}
                    </Button>
                </Group>
            </Paper>

            <Stack gap="md">
                {pedidos.map((pedido, pedidoIndex) => (
                    <Paper key={pedido.codigo_b2b} p="md" withBorder>
                        <Group justify="space-between" wrap="nowrap" mb="md">
                            <Group>
                                <Checkbox
                                    checked={pedido.seleccionado}
                                    onChange={() => handleTogglePedido(pedidoIndex)}
                                    disabled={pedido.estado_validacion === 'cargado'}
                                />
                                <div>
                                    <Group gap="xs">
                                        <Text fw={600}>{pedido.codigo_b2b}</Text>
                                        {pedido.es_duplicado_diferente && pedido.codigo_b2b_alternativo && (
                                            <Badge color="orange" size="sm" variant="light">
                                                → {pedido.codigo_b2b_alternativo}
                                            </Badge>
                                        )}
                                        {getEstadoBadge(pedido.estado_validacion)}
                                        {!pedido.cliente_existe && (
                                            <Badge color="orange" size="sm">Cliente Nuevo</Badge>
                                        )}
                                    </Group>
                                    <Text size="sm" c="dimmed">
                                        {pedido.info_cliente.razon_social} - {pedido.productos.length} producto(s)
                                    </Text>
                                </div>
                            </Group>
                            <Group gap="xs">
                                {pedido.ruta_pdf && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconFileText size={12} />}
                                        onClick={() => handleDescargarPDF(pedido.ruta_pdf!, pedido.codigo_b2b)}
                                    >
                                        PDF
                                    </Button>
                                )}
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconTrash size={12} />}
                                    onClick={() => handleEliminarPedido(pedidoIndex)}
                                >
                                    Eliminar
                                </Button>
                            </Group>
                        </Group>
                        
                        <Accordion variant="default">
                            <Accordion.Item value={`pedido-${pedidoIndex}`}>
                                <Accordion.Control>
                                    <Text size="sm" c="dimmed">📋 Ver detalles del pedido</Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="md">

                                {/* Advertencias */}
                                {pedido.advertencias.length > 0 && (
                                    <Alert
                                        icon={<IconAlertTriangle size={16} />}
                                        title="Advertencias"
                                        color={pedido.estado_validacion === 'error' ? 'red' : 'yellow'}
                                    >
                                        <Stack gap="xs">
                                            {pedido.advertencias.map((adv, idx) => (
                                                <Text key={idx} size="sm">• {adv}</Text>
                                            ))}
                                        </Stack>
                                    </Alert>
                                )}

                                {/* Información del Cliente */}
                                <div>
                                    <Text fw={600} mb="xs">Información del Cliente</Text>
                                    <Group grow>
                                        <TextInput
                                            label="RUT"
                                            value={pedido.info_cliente.rut}
                                            onChange={(e) => handleUpdateClienteInfo(pedidoIndex, 'rut', e.currentTarget.value)}
                                        />
                                        <TextInput
                                            label="Razón Social"
                                            value={pedido.info_cliente.razon_social}
                                            onChange={(e) => handleUpdateClienteInfo(pedidoIndex, 'razon_social', e.currentTarget.value)}
                                        />
                                    </Group>
                                    <Group grow mt="xs">
                                        <TextInput
                                            label="Dirección"
                                            value={pedido.info_cliente.direccion}
                                            onChange={(e) => handleUpdateClienteInfo(pedidoIndex, 'direccion', e.currentTarget.value)}
                                        />
                                        <TextInput
                                            label="Comuna"
                                            value={pedido.info_cliente.comuna}
                                            onChange={(e) => handleUpdateClienteInfo(pedidoIndex, 'comuna', e.currentTarget.value)}
                                        />
                                    </Group>
                                </div>

                                <Divider />

                                {/* Tabla de Productos */}
                                <div>
                                    <Text fw={600} mb="xs">Productos del Pedido</Text>
                                    <ScrollArea>
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>SKU</Table.Th>
                                                    <Table.Th>Nombre Producto</Table.Th>
                                                    <Table.Th>Cantidad</Table.Th>
                                                    <Table.Th>Precio Unit.</Table.Th>
                                                    <Table.Th>Subtotal</Table.Th>
                                                    <Table.Th>Estado</Table.Th>
                                                    <Table.Th>Acciones</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {pedido.productos.map((producto, prodIndex) => (
                                                    <Table.Tr key={prodIndex}>
                                                        <Table.Td>
                                                            <TextInput
                                                                value={producto.sku}
                                                                onChange={(e) => handleUpdateProducto(pedidoIndex, prodIndex, 'sku', e.currentTarget.value)}
                                                                size="xs"
                                                            />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <TextInput
                                                                value={producto.nombre_producto}
                                                                onChange={(e) => handleUpdateProducto(pedidoIndex, prodIndex, 'nombre_producto', e.currentTarget.value)}
                                                                size="xs"
                                                            />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <NumberInput
                                                                value={producto.cantidad}
                                                                onChange={(val) => handleUpdateProducto(pedidoIndex, prodIndex, 'cantidad', val)}
                                                                size="xs"
                                                                min={1}
                                                                w={80}
                                                            />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <NumberInput
                                                                value={producto.valor_unitario}
                                                                onChange={(val) => handleUpdateProducto(pedidoIndex, prodIndex, 'valor_unitario', val)}
                                                                size="xs"
                                                                prefix="$"
                                                                decimalScale={2}
                                                                w={120}
                                                            />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            ${(producto.cantidad * producto.valor_unitario).toLocaleString('es-CL')}
                                                        </Table.Td>
                                                        <Table.Td>
                                                            {producto.existe ? (
                                                                <Badge color="green" size="sm">Existe</Badge>
                                                            ) : (
                                                                <Badge color="orange" size="sm">Nuevo</Badge>
                                                            )}
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <ActionIcon
                                                                color="red"
                                                                variant="subtle"
                                                                size="sm"
                                                                onClick={() => handleEliminarProducto(pedidoIndex, prodIndex)}
                                                            >
                                                                <IconTrash size={16} />
                                                            </ActionIcon>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                            <Table.Tfoot>
                                                <Table.Tr>
                                                    <Table.Td colSpan={4} style={{ textAlign: 'right' }}>
                                                        <Text fw={600}>Total Pedido:</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text fw={600}>
                                                            ${pedido.productos.reduce((sum, p) => sum + (p.cantidad * p.valor_unitario), 0).toLocaleString('es-CL')}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td colSpan={2}></Table.Td>
                                                </Table.Tr>
                                            </Table.Tfoot>
                                        </Table>
                                    </ScrollArea>
                                </div>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Paper>
                ))}
            </Stack>

            {/* Footer fijo */}
            <Paper shadow="md" p="md" mt="xl" style={{ position: 'sticky', bottom: 0, zIndex: 100 }}>
                <Group justify="space-between">
                    <div>
                        <Text fw={600}>Resumen de la Carga</Text>
                        <Text size="sm" c="dimmed">
                            {pedidosSeleccionados} pedido(s) seleccionado(s) - 
                            {crearClientes ? ' Crear clientes nuevos' : ' No crear clientes'} - 
                            {crearProductos ? ' Crear productos nuevos' : ' No crear productos'}
                        </Text>
                    </div>
                    <Group>
                        <Button variant="outline" onClick={() => navigate('/pedidos')} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            leftSection={<IconUpload size={16} />}
                            onClick={handleProcesar}
                            loading={loading}
                            disabled={pedidosSeleccionados === 0}
                        >
                            Iniciar Carga ({pedidosSeleccionados})
                        </Button>
                    </Group>
                </Group>
            </Paper>
        </Box>
    );
}


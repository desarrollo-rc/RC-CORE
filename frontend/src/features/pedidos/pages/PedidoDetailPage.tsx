// frontend/src/features/pedidos/pages/PedidoDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Title, Group, Alert, Center, Loader, Paper, Text, Grid, Badge, Table, Timeline, ThemeIcon, ActionIcon, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconFileText } from '@tabler/icons-react';
import { getPedidoById } from '../services/pedidoService';
import { descargarPDFGmail, descargarArchivo } from '../services/archivoService';
import type { Pedido, PedidoDetalle as PedidoDetalleType, HistorialEstado } from '../types';
import { PedidoActionPanel } from '../components/PedidoActionPanel';
import { notifications } from '@mantine/notifications';

// --- Componente para la Cabecera ---
function PedidoHeader({ pedido }: { pedido: Pedido }) {
    const handleDescargarPDF = async () => {
        if (!pedido.ruta_pdf) return;

        try {
            // Extraer la ruta relativa del path completo
            const rutaRelativa = pedido.ruta_pdf.split('gmail_pdfs/')[1];
            
            notifications.show({
                id: 'descargando-pdf',
                title: 'Descargando PDF',
                message: 'Preparando descarga del archivo...',
                loading: true,
                autoClose: false,
            });

            const blob = await descargarPDFGmail(rutaRelativa);
            const nombreArchivo = `${pedido.codigo_pedido_origen || pedido.id_pedido}.pdf`;
            descargarArchivo(blob, nombreArchivo);

            notifications.update({
                id: 'descargando-pdf',
                title: 'Descarga Completada',
                message: `PDF ${nombreArchivo} descargado exitosamente`,
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

    return (
        <Paper withBorder p="lg" mb="lg">
            <Group justify="space-between">
                <Box>
                    <Group gap="md" align="center">
                        <Title order={2}>Pedido #{pedido.codigo_pedido_origen || pedido.id_pedido}</Title>
                        {pedido.ruta_pdf && (
                            <Tooltip label="Descargar PDF del pedido">
                                <ActionIcon
                                    size="lg"
                                    variant="light"
                                    color="red"
                                    onClick={handleDescargarPDF}
                                >
                                    <IconFileText size={18} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                    <Text c="dimmed">{pedido.cliente.nombre_cliente}</Text>
                </Box>
                <Box ta="right">
                    <Text size="lg" fw={700}>{`$${Math.round(Number(pedido.monto_total)).toLocaleString('es-CL')}`}</Text>
                    <Text c="dimmed" size="sm">Total</Text>
                </Box>
            </Group>
            <Group mt="md">
                <Badge color="blue" size="lg" variant="light">
                    {pedido.estado_general.nombre_estado}
                </Badge>
                <Badge color="orange" size="lg" variant="light">
                    {pedido.estado_credito.nombre_estado}
                </Badge>
                {pedido.estado_logistico && (
                    <Badge color="grape" size="lg" variant="light">
                        {pedido.estado_logistico.nombre_estado}
                    </Badge>
                )}
                {pedido.numero_pedido_sap && (
                    <Badge color="green" size="lg" variant="light">
                        SAP: {pedido.numero_pedido_sap}
                    </Badge>
                )}
            </Group>
        </Paper>
    );
}

// --- Componente para la Tabla de Productos ---
function PedidoDetalles({ detalles }: { detalles: PedidoDetalleType[] }) {
    const rows = detalles.map((item) => (
        <Table.Tr key={item.id_producto}>
            <Table.Td>{item.producto?.producto_sku || 'N/A'}</Table.Td>
            <Table.Td>{item.producto?.producto_nombre || 'Producto no encontrado'}</Table.Td>
            <Table.Td ta="right">{item.cantidad}</Table.Td>
            <Table.Td ta="right">{`$${Number(item.precio_unitario).toLocaleString('es-CL')}`}</Table.Td>
            <Table.Td ta="right">{`$${Number(item.subtotal).toLocaleString('es-CL')}`}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder p="lg" mb="lg">
            <Title order={4} mb="md">Productos</Title>
            <Table striped withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>SKU</Table.Th>
                        <Table.Th>Nombre</Table.Th>
                        <Table.Th ta="right">Cantidad</Table.Th>
                        <Table.Th ta="right">Precio Unit.</Table.Th>
                        <Table.Th ta="right">Subtotal</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Paper>
    );
}

// --- Componente para la Línea de Tiempo ---
function PedidoTimeline({ historial }: { historial: HistorialEstado[] }) {
    return (
        <Paper withBorder p="lg">
            <Title order={4} mb="xl">Línea de Tiempo</Title>
            <Timeline active={historial.length} bulletSize={24} lineWidth={2}>
                {historial.slice().reverse().map((evento, index) => (
                    <Timeline.Item
                        key={index}
                        bullet={
                            <ThemeIcon size={24} radius="xl" color='green'>
                                <IconCircleCheck size="0.9rem" />
                            </ThemeIcon>
                        }
                        title={`${evento.tipo_estado}: ${evento.estado_nuevo}`}
                    >
                        <Text c="dimmed" size="sm">
                            {new Date(evento.fecha_evento).toLocaleString('es-CL')} por {evento.usuario_responsable?.nombre_completo || 'Sistema'}
                        </Text>
                        {evento.observaciones && <Text size="sm" mt={4}>"{evento.observaciones}"</Text>}
                    </Timeline.Item>
                ))}
            </Timeline>
        </Paper>
    );
}

// --- Componente Principal de la Página ---
export function PedidoDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            navigate('/pedidos');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getPedidoById(Number(id));
                setPedido(data);
                setError(null);
            } catch (err) {
                setError('No se pudo cargar el detalle del pedido.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleUpdate = (updatedPedido: Pedido) => {
        setPedido(updatedPedido);
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;
    if (!pedido) return <Center h={200}><Text>Pedido no encontrado.</Text></Center>;

    return (
        <Box>
            <PedidoHeader pedido={pedido} />
            <Grid>
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <PedidoDetalles detalles={pedido.detalles} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <PedidoActionPanel pedido={pedido} onUpdate={handleUpdate} />

                    <Box mt="lg">
                        <PedidoTimeline historial={pedido.historial_estados} />
                    </Box>
                </Grid.Col>
            </Grid>
            {/* Aquí es donde pondremos el panel de acciones para actualizar el estado */}
        </Box>
    );
}
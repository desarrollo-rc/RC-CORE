// frontend/src/features/pedidos/pages/PedidoDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Title, Group, Alert, Center, Loader, Paper, Text, Grid, Badge, Table, Timeline, ThemeIcon, ActionIcon, Tooltip, Modal, Button, TextInput, Divider } from '@mantine/core';
import { IconCircleCheck, IconFileText } from '@tabler/icons-react';
import { getPedidoById, actualizarFechasHistorial } from '../services/pedidoService';
import { descargarPDFGmail, descargarArchivo } from '../services/archivoService';
import type { Pedido, PedidoDetalle as PedidoDetalleType, HistorialEstado } from '../types';
import { PedidoActionPanel } from '../components/PedidoActionPanel';
import { notifications } from '@mantine/notifications';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showNotification } from '@mantine/notifications';

// --- Componente para la Cabecera ---
function PedidoHeader({ pedido }: { pedido: Pedido }) {
    // Calcular clasificación RIFLEO/MAYORISTA
    const skuCount = pedido.detalles.length;
    const esRifleo = skuCount <= 6 && pedido.detalles.every(item => item.cantidad <= 1);
    const tipoPedido = esRifleo ? 'RIFLEO' : 'MAYORISTA';
    const colorTipo = esRifleo ? 'blue' : 'orange';

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
                        <Badge color={colorTipo} size="xl" variant="filled">
                            {tipoPedido}
                        </Badge>
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
                    <Text c="dimmed">{pedido.cliente.nombre_cliente} - {pedido.cliente.codigo_cliente}</Text>
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
                {pedido.numero_factura_sap && (
                    <Badge color="indigo" size="lg" variant="light">
                        Factura: {pedido.numero_factura_sap}
                    </Badge>
                )}
                {pedido.factura_manual && !pedido.numero_factura_sap && (
                    <Badge color="indigo" size="lg" variant="light">
                        Factura Manual
                    </Badge>
                )}
                {pedido.vendedor && (
                    <Badge color="teal" size="lg" variant="light">
                        Vendedor: {pedido.vendedor.usuario.nombre_completo}
                    </Badge>
                )}
            </Group>
        </Paper>
    );
}

// --- Componente para la Tabla de Productos ---
function PedidoDetalles({ detalles }: { detalles: PedidoDetalleType[] }) {
    // Calcular clasificación RIFLEO/MAYORISTA
    const skuCount = detalles.length;
    const esRifleo = skuCount <= 6 && detalles.every(item => item.cantidad <= 1);
    const tipoPedido = esRifleo ? 'RIFLEO' : 'MAYORISTA';
    const colorTipo = esRifleo ? 'blue' : 'orange';

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
            <Group justify="space-between" mb="md">
                <Title order={4}>Productos</Title>
                <Badge color={colorTipo} size="lg" variant="light">
                    {tipoPedido}
                </Badge>
            </Group>
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
function PedidoTimeline({ historial, pedidoId, onUpdate }: { historial: HistorialEstado[]; pedidoId: number; onUpdate: (pedido: Pedido) => void }) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    
    return (
        <Paper withBorder p="lg">
            <Group justify="space-between" mb="xl">
                <Title order={4}>Línea de Tiempo</Title>
                <Button variant="light" size="sm" onClick={() => setEditModalOpen(true)}>Editar Fechas</Button>
            </Group>
            <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Fechas del Historial" size="lg" centered>
                <EditarFechasHistorialForm historial={historial} pedidoId={pedidoId} onUpdate={onUpdate} close={() => setEditModalOpen(false)} />
            </Modal>
            <Timeline active={historial.length} bulletSize={24} lineWidth={2}>
                {historial.slice().reverse().map((evento, index) => (
                    <Timeline.Item
                        key={index}
                        bullet={
                            <ThemeIcon size={24} radius="xl" color='green'>
                                <IconCircleCheck size="0.9rem" />
                            </ThemeIcon>
                        }
                        title={`${evento.tipo_estado}: ${evento.estado_nuevo}${evento.fecha_evento_fin ? ' (Completado)' : ''}`}
                    >
                        {evento.fecha_evento_fin ? (
                            <>
                                <Text c="dimmed" size="sm">
                                    📍 Iniciado: {new Date(evento.fecha_evento).toLocaleString('es-CL')} por {evento.usuario_responsable?.nombre_completo || 'Sistema'}
                                </Text>
                                <Text c="dimmed" size="sm" mt={2} fw={500}>
                                    ✅ Finalizado: {new Date(evento.fecha_evento_fin).toLocaleString('es-CL')}
                                </Text>
                                {evento.observaciones && <Text size="sm" mt={4}>"{evento.observaciones}"</Text>}
                            </>
                        ) : (
                            <>
                                <Text c="dimmed" size="sm">
                                    {new Date(evento.fecha_evento).toLocaleString('es-CL')} por {evento.usuario_responsable?.nombre_completo || 'Sistema'}
                                </Text>
                                {evento.observaciones && <Text size="sm" mt={4}>"{evento.observaciones}"</Text>}
                            </>
                        )}
                    </Timeline.Item>
                ))}
            </Timeline>
        </Paper>
    );
}

// --- Componente para Editar Fechas del Historial ---
function EditarFechasHistorialForm({ historial, pedidoId, onUpdate, close }: { historial: HistorialEstado[]; pedidoId: number; onUpdate: (pedido: Pedido) => void; close: () => void }) {
    const queryClient = useQueryClient();
    
    const defaultValues = historial.reduce((acc, evento) => {
        if (evento.id_historial) {
            acc[`evento_${evento.id_historial}_inicio`] = new Date(evento.fecha_evento);
            if (evento.fecha_evento_fin) {
                acc[`evento_${evento.id_historial}_fin`] = new Date(evento.fecha_evento_fin);
            }
        }
        return acc;
    }, {} as Record<string, Date>);

    const { control, handleSubmit } = useForm({
        defaultValues
    });

    const mutation = useMutation({
        mutationFn: (data: { actualizaciones: Array<{ id_historial: number; fecha_evento: string; fecha_evento_fin?: string | null }> }) =>
            actualizarFechasHistorial(pedidoId, data),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedidoId], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Fechas actualizadas correctamente.', color: 'green' });
            close();
        },
        onError: (error: any) => {
            const apiMsg = error?.response?.data?.error || (typeof error?.response?.data === 'string' ? error.response.data : null);
            const message = apiMsg || error?.message || 'Error al actualizar fechas';
            showNotification({ title: 'Error', message, color: 'red' });
        }
    });

    const onSubmit: SubmitHandler<any> = (data) => {
        const actualizaciones = historial
            .filter(e => e.id_historial)
            .map(evento => {
                const inicioKey = `evento_${evento.id_historial}_inicio`;
                const finKey = `evento_${evento.id_historial}_fin`;
                
                const fechaInicio = data[inicioKey];
                const fechaFin = data[finKey];
                
                const actualizacion: { id_historial: number; fecha_evento: string; fecha_evento_fin?: string | null } = {
                    id_historial: evento.id_historial!,
                    fecha_evento: fechaInicio instanceof Date ? fechaInicio.toISOString() : new Date(fechaInicio).toISOString()
                };
                
                // Solo incluir fecha_evento_fin si el evento originalmente la tenía o si se está agregando
                if (evento.fecha_evento_fin !== null && evento.fecha_evento_fin !== undefined) {
                    actualizacion.fecha_evento_fin = fechaFin ? 
                        (fechaFin instanceof Date ? fechaFin.toISOString() : new Date(fechaFin).toISOString()) : 
                        null;
                }
                
                return actualizacion;
            });
        
        mutation.mutate({ actualizaciones });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {historial.map((evento, index) => {
                    if (!evento.id_historial) return null;
                    
                    return (
                        <Box key={evento.id_historial} mb="xl">
                            <Text fw={600} mb="md">
                                {evento.tipo_estado}: {evento.estado_nuevo}
                                {evento.estado_anterior && ` (de ${evento.estado_anterior})`}
                            </Text>
                            <FechaHoraController 
                                control={control} 
                                name={`evento_${evento.id_historial}_inicio`}
                                label="Fecha y Hora de Inicio"
                            />
                            {evento.fecha_evento_fin !== null && evento.fecha_evento_fin !== undefined && (
                                <FechaHoraController 
                                    control={control} 
                                    name={`evento_${evento.id_historial}_fin`}
                                    label="Fecha y Hora de Fin"
                                />
                            )}
                            {index < historial.length - 1 && <Divider my="lg" />}
                        </Box>
                    );
                })}
            </Box>
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Guardar Cambios</Button>
            </Group>
        </form>
    );
}

function FechaHoraController({ control, name, label }: { control: any, name: string, label?: string }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentDate = field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : new Date();
                
                const dateValue = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                
                const handleDatePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const dateStr = e.currentTarget.value;
                    if (!dateStr) return;
                    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                    const newFullDate = new Date(yyyy, mm - 1, dd, currentDate.getHours(), currentDate.getMinutes(), 0, 0);
                    field.onChange(newFullDate);
                };
                
                const handleTimePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const [hours, minutes] = e.currentTarget.value.split(':');
                    if (!isNaN(parseInt(hours,10)) && !isNaN(parseInt(minutes,10))) {
                        const newFullDate = new Date(currentDate);
                        newFullDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                        field.onChange(newFullDate);
                    }
                };
                
                const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

                return (
                    <Group grow mt="md">
                        <TextInput 
                            type="date" 
                            value={dateValue} 
                            onChange={handleDatePartChange} 
                            label={label || "Fecha del Evento"} 
                            required 
                        />
                        <TextInput 
                            type="time" 
                            value={timeValue} 
                            onChange={handleTimePartChange} 
                            label={label ? label.replace('Fecha y Hora', 'Hora').replace('Fecha', 'Hora') : "Hora del Evento"} 
                            required 
                        />
                    </Group>
                );
            }}
        />
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
                        <PedidoTimeline historial={pedido.historial_estados} pedidoId={pedido.id_pedido} onUpdate={handleUpdate} />
                    </Box>
                </Grid.Col>
            </Grid>
            {/* Aquí es donde pondremos el panel de acciones para actualizar el estado */}
        </Box>
    );
}
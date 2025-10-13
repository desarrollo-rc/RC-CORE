// frontend/src/features/instalaciones/pages/InstalacionDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Title, Group, Alert, Center, Loader, Paper, Text, Grid, Badge, Timeline, ThemeIcon, Stack } from '@mantine/core';
import { IconCircleCheck, IconClock } from '@tabler/icons-react';
import { getInstalacionById } from '../services/instalacionService';
import type { Instalacion } from '../types';
import { InstalacionActionPanel } from '../components/InstalacionActionPanel';

const getEstadoColor = (estado: string) => {
    const colorMap: Record<string, string> = {
        'Pendiente Aprobación': 'yellow',
        'Pendiente Instalación': 'blue',
        'Agendada': 'cyan',
        'Completada': 'green',
        'Cancelada': 'red',
    };
    return colorMap[estado] || 'gray';
};

// ===== COMPONENTE HEADER =====

function InstalacionHeader({ instalacion }: { instalacion: Instalacion }) {
    return (
        <Paper withBorder p="lg" mb="lg">
            <Group justify="space-between">
                <Box>
                    <Title order={2}>Instalación #{instalacion.id_instalacion}</Title>
                    <Text c="dimmed">
                        {instalacion.caso?.titulo || `Caso #${instalacion.id_caso}`}
                    </Text>
                </Box>
                <Badge color={getEstadoColor(instalacion.estado)} size="xl" variant="light">
                    {instalacion.estado}
                </Badge>
            </Group>
        </Paper>
    );
}

// ===== COMPONENTE INFORMACIÓN =====

function InstalacionInfo({ instalacion }: { instalacion: Instalacion }) {
    return (
        <Paper withBorder p="lg" mb="lg">
            <Title order={4} mb="md">Información General</Title>
            <Stack gap="sm">
                <Group>
                    <Text fw={500} w={180}>Usuario B2B:</Text>
                    <Text>{instalacion.usuario_b2b?.nombre_completo || 'No asignado'}</Text>
                </Group>
                <Group>
                    <Text fw={500} w={180}>Email:</Text>
                    <Text>{instalacion.usuario_b2b?.email || '-'}</Text>
                </Group>
                <Group>
                    <Text fw={500} w={180}>Usuario Login:</Text>
                    <Text>{instalacion.usuario_b2b?.usuario || '-'}</Text>
                </Group>
                <Group>
                    <Text fw={500} w={180}>Fecha Solicitud:</Text>
                    <Text>{new Date(instalacion.fecha_solicitud).toLocaleString('es-CL')}</Text>
                </Group>
                {instalacion.observaciones && (
                    <>
                        <Text fw={500} mt="sm">Observaciones Iniciales:</Text>
                        <Text c="dimmed" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {instalacion.observaciones}
                        </Text>
                    </>
                )}
            </Stack>
        </Paper>
    );
}

// ===== COMPONENTE TIMELINE =====

function InstalacionTimeline({ instalacion }: { instalacion: Instalacion }) {
    // Determinar si es una instalación de cambio de equipo
    const esCambioEquipo = instalacion.caso?.titulo?.includes('cambio de equipo') || 
                          instalacion.caso?.titulo?.includes('Cambio de equipo') ||
                          instalacion.caso?.titulo?.includes('CAMBIO DE EQUIPO');
    
    // Determinar si es una instalación de usuario adicional
    const esUsuarioAdicional = instalacion.caso?.titulo?.includes('usuario adicional') || 
                              instalacion.caso?.titulo?.includes('Usuario adicional') ||
                              instalacion.caso?.titulo?.includes('USUARIO_ADICIONAL');
    
    const eventos: Array<{ fecha: string | null; titulo: string; completado: boolean; noRequerido?: boolean }> = [
        {
            fecha: instalacion.fecha_solicitud,
            titulo: 'Solicitud Creada',
            completado: true,
        },
        {
            fecha: (esCambioEquipo || esUsuarioAdicional) ? null : instalacion.fecha_aprobacion, // Para cambio de equipo y usuario adicional, no mostrar fecha
            titulo: 'Aprobación',
            completado: (esCambioEquipo || esUsuarioAdicional) ? true : !!instalacion.fecha_aprobacion, // Para cambio de equipo y usuario adicional, siempre completada
            noRequerido: (esCambioEquipo || esUsuarioAdicional), // Marcar como no requerida para cambio de equipo y usuario adicional
        },
        {
            fecha: esCambioEquipo ? null : instalacion.fecha_creacion_usuario, // Para cambio de equipo no mostrar fecha, para usuario adicional mostrar fecha
            titulo: esCambioEquipo ? 'Usuario B2B Asignado' : 'Usuario B2B Creado',
            completado: (esCambioEquipo || esUsuarioAdicional) ? true : !!instalacion.fecha_creacion_usuario, // Para cambio de equipo y usuario adicional, siempre completada
            noRequerido: esCambioEquipo, // Solo para cambio de equipo marcar como no requerida
        },
        {
            fecha: instalacion.fecha_instalacion,
            titulo: 'Instalación Realizada',
            completado: !!instalacion.fecha_instalacion,
        },
        {
            fecha: instalacion.fecha_capacitacion,
            titulo: 'Capacitación',
            completado: !!instalacion.fecha_capacitacion || instalacion.estado === 'Completada',
        },
        {
            fecha: instalacion.fecha_finalizacion,
            titulo: 'Finalización',
            completado: !!instalacion.fecha_finalizacion,
        },
    ];

    // Filtrar eventos no completados que no son el siguiente paso
    const eventosVisibles = eventos.filter((e, index) => {
        if (e.completado) return true;
        // Mostrar el siguiente paso pendiente
        const anteriorCompletado = index === 0 || eventos[index - 1].completado;
        return anteriorCompletado;
    });

    return (
        <Paper withBorder p="lg">
            <Title order={4} mb="xl">Progreso de Instalación</Title>
            <Timeline active={eventosVisibles.filter(e => e.completado).length} bulletSize={24} lineWidth={2}>
                {eventosVisibles.map((evento, index) => (
                    <Timeline.Item
                        key={index}
                        bullet={
                            evento.completado ? (
                                <ThemeIcon size={24} radius="xl" color="green">
                                    <IconCircleCheck size="0.9rem" />
                                </ThemeIcon>
                            ) : (
                                <ThemeIcon size={24} radius="xl" color="gray" variant="outline">
                                    <IconClock size="0.9rem" />
                                </ThemeIcon>
                            )
                        }
                        title={evento.titulo}
                        color={evento.completado ? 'green' : 'gray'}
                    >
                        {evento.fecha ? (
                            <Text c="dimmed" size="sm">
                                {new Date(evento.fecha).toLocaleString('es-CL')}
                            </Text>
                        ) : evento.noRequerido ? (
                            <Text c="dimmed" size="sm" fs="italic">
                                No requerida
                            </Text>
                        ) : evento.completado && evento.titulo === 'Capacitación' ? (
                            <Text c="dimmed" size="sm" fs="italic">
                                No requerida
                            </Text>
                        ) : (
                            <Text c="dimmed" size="sm" fs="italic">
                                Pendiente
                            </Text>
                        )}
                    </Timeline.Item>
                ))}
            </Timeline>
        </Paper>
    );
}

// ===== COMPONENTE PRINCIPAL =====

export function InstalacionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [instalacion, setInstalacion] = useState<Instalacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            navigate('/instalaciones');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getInstalacionById(Number(id));
                setInstalacion(data);
                setError(null);
            } catch (err) {
                setError('No se pudo cargar el detalle de la instalación.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleUpdate = (updatedInstalacion: Instalacion) => {
        setInstalacion(updatedInstalacion);
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;
    if (!instalacion) return <Center h={200}><Text>Instalación no encontrada.</Text></Center>;

    return (
        <Box>
            <InstalacionHeader instalacion={instalacion} />
            
            <Grid>
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <InstalacionInfo instalacion={instalacion} />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <InstalacionActionPanel instalacion={instalacion} onUpdate={handleUpdate} />
                    
                    <Box mt="lg">
                        <InstalacionTimeline instalacion={instalacion} />
                    </Box>
                </Grid.Col>
            </Grid>
        </Box>
    );
}


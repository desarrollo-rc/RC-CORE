// frontend/src/features/instalaciones/components/InstalacionActionPanel.tsx
import { useState } from 'react';
import { Paper, Title, Button, Group, Modal, Textarea, Switch, Box, Text, TextInput, Radio, Stack, Loader, Alert, Badge, Divider } from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showNotification } from '@mantine/notifications';
import type { Instalacion, AprobarInstalacionPayload, RealizarInstalacionPayload, FinalizarInstalacionPayload } from '../types';
import { 
    aprobarInstalacion, 
    rechazarInstalacion, 
    marcarUsuarioCreado,
    agendarInstalacion,
    marcarInstalada,
    finalizarInstalacion,
    sincronizarEquipos,
    crearEquipoInstalacion,
    activarEquipo,
    instalarEquipo
} from '../services/instalacionService';

// ===== SCHEMAS DE VALIDACIÓN =====

const aprobarSchema = z.object({
    fecha_aprobacion: z.coerce.date(),
    observaciones: z.string().optional(),
});
type AprobarFormValues = z.infer<typeof aprobarSchema>;

const rechazarSchema = z.object({
    observaciones: z.string().min(10, 'La observación debe tener al menos 10 caracteres'),
});
type RechazarFormValues = z.infer<typeof rechazarSchema>;

const crearUsuarioSchema = z.object({
    nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().optional(),
    existe_en_sistema: z.boolean(),
    existe_en_corp: z.boolean(),
    id_usuario_b2b: z.number().optional(),
});
type CrearUsuarioFormValues = z.infer<typeof crearUsuarioSchema>;

const agendarSchema = z.object({
    fecha_visita: z.coerce.date(),
    observaciones: z.string().optional(),
});
type AgendarFormValues = z.infer<typeof agendarSchema>;

const instalarSchema = z.object({
    fecha_instalacion: z.coerce.date(),
    observaciones: z.string().optional(),
});
type InstalarFormValues = z.infer<typeof instalarSchema>;

const finalizarSchema = z.object({
    capacitacion_realizada: z.boolean(),
    observaciones: z.string().optional(),
});
type FinalizarFormValues = z.infer<typeof finalizarSchema>;

interface InstalacionActionPanelProps {
    instalacion: Instalacion;
    onUpdate: (updatedInstalacion: Instalacion) => void;
}

export function InstalacionActionPanel({ instalacion, onUpdate }: InstalacionActionPanelProps) {
    const queryClient = useQueryClient();
    const [modalType, setModalType] = useState<'aprobar' | 'rechazar' | 'usuario' | 'equipo' | 'agendar' | 'instalar' | 'finalizar' | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

    // ===== MUTATIONS =====

    const aprobarMutation = useMutation({
        mutationFn: () => aprobarInstalacion(instalacion.id_instalacion),
        onSuccess: (updated) => {
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Éxito', message: 'Instalación aprobada', color: 'green' });
            closeModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.response?.data?.error || error.message, color: 'red' }),
    });

    const rechazarMutation = useMutation({
        mutationFn: (observaciones: string) => rechazarInstalacion(instalacion.id_instalacion, observaciones),
        onSuccess: (updated) => {
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Instalación Rechazada', message: 'La instalación ha sido rechazada', color: 'orange' });
            closeModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' }),
    });

    const crearUsuarioMutation = useMutation({
        mutationFn: (data: CrearUsuarioFormValues) =>
            marcarUsuarioCreado(instalacion.id_instalacion, data),
        onSuccess: (updated) => {
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Éxito', message: 'Usuario B2B creado y registrado', color: 'green' });
            closeModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.response?.data?.error || error.message, color: 'red' }),
    });

    const agendarMutation = useMutation({
        mutationFn: (data: AgendarFormValues) =>
            agendarInstalacion(instalacion.id_instalacion, data.fecha_visita.toISOString(), data.observaciones),
        onSuccess: (updated) => {
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Éxito', message: 'Instalación agendada', color: 'green' });
            closeModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' }),
    });

    const instalarMutation = useMutation({
        mutationFn: (data: InstalarFormValues) =>
            marcarInstalada(instalacion.id_instalacion, {
                fecha_instalacion: data.fecha_instalacion.toISOString(),
                observaciones: data.observaciones,
            }),
        onSuccess: (updated) => {
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Éxito', message: 'Instalación realizada', color: 'green' });
            closeModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' }),
    });

    const finalizarMutation = useMutation({
        mutationFn: (capacitacion_realizada: boolean) =>
            finalizarInstalacion(instalacion.id_instalacion, capacitacion_realizada),
        onSuccess: (updated) => {
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Éxito', message: 'Instalación finalizada', color: 'green' });
            closeModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.response?.data?.error || error.message, color: 'red' }),
    });

    const handleOpenModal = (type: typeof modalType) => {
        setModalType(type);
        openModal();
    };

    // ===== RENDERIZADO DE ACCIONES SEGÚN ESTADO =====

    const renderAcciones = () => {
        const estado = instalacion.estado;

        if (estado === 'Cancelada') {
            return <Text c="dimmed">Esta instalación ha sido cancelada.</Text>;
        }

        if (estado === 'Completada') {
            return <Text c="green">✅ Instalación completada exitosamente.</Text>;
        }

        switch (estado) {
            case 'Pendiente Aprobación':
                return (
                    <Group>
                        <Button color="green" onClick={() => handleOpenModal('aprobar')}>
                            Aprobar Instalación
                        </Button>
                        <Button color="red" variant="outline" onClick={() => handleOpenModal('rechazar')}>
                            Rechazar
                        </Button>
                    </Group>
                );

            case 'Pendiente Instalación':
                return (
                    <Button onClick={() => handleOpenModal('usuario')}>
                        Crear Usuario B2B
                    </Button>
                );
            
            case 'Usuario Creado':
            case 'Configuración Pendiente':
                // Si ya tiene fecha_instalacion, permitir finalizar
                if (instalacion.fecha_instalacion) {
                    return (
                        <Button color="blue" onClick={() => handleOpenModal('finalizar')}>
                            Finalizar Instalación
                        </Button>
                    );
                }
                // Si no tiene fecha_instalacion, permitir gestionar equipo o agendar
                return (
                    <Group>
                        <Button onClick={() => handleOpenModal('equipo')}>
                            Gestionar Equipo e Instalar
                        </Button>
                        <Button variant="outline" onClick={() => handleOpenModal('agendar')}>
                            Agendar para Después
                        </Button>
                    </Group>
                );

            case 'Agendada':
                // Si ya tiene fecha_instalacion, permitir finalizar
                if (instalacion.fecha_instalacion) {
                    return (
                        <Button color="blue" onClick={() => handleOpenModal('finalizar')}>
                            Finalizar Instalación
                        </Button>
                    );
                }
                // Si no tiene fecha_instalacion, permitir gestionar equipo
                return (
                    <Button onClick={() => handleOpenModal('equipo')}>
                        Gestionar Equipo e Instalar
                    </Button>
                );

            default:
                // Si ya tiene fecha_instalacion pero no está completada, permitir finalizar
                if (instalacion.fecha_instalacion && instalacion.estado !== 'Completada') {
                    return (
                        <Button color="blue" onClick={() => handleOpenModal('finalizar')}>
                            Finalizar Instalación
                        </Button>
                    );
                }
                return <Text c="dimmed">No hay acciones disponibles.</Text>;
        }
    };

    return (
        <>
            <Paper withBorder p="lg">
                <Title order={4} mb="md">Acciones Disponibles</Title>
                {renderAcciones()}
            </Paper>

            {/* Modales */}
            <Modal opened={modalOpened} onClose={closeModal} title={getModalTitle(modalType)} centered size={modalType === 'equipo' ? 'xl' : 'md'}>
                {modalType === 'aprobar' && <AprobarForm mutation={aprobarMutation} close={closeModal} />}
                {modalType === 'rechazar' && <RechazarForm mutation={rechazarMutation} close={closeModal} />}
                {modalType === 'usuario' && <CrearUsuarioForm mutation={crearUsuarioMutation} close={closeModal} />}
                {modalType === 'equipo' && <GestionarEquipoForm instalacion={instalacion} onUpdate={onUpdate} close={closeModal} />}
                {modalType === 'agendar' && <AgendarForm mutation={agendarMutation} close={closeModal} />}
                {modalType === 'instalar' && <InstalarForm mutation={instalarMutation} close={closeModal} />}
                {modalType === 'finalizar' && <FinalizarForm mutation={finalizarMutation} close={closeModal} />}
            </Modal>
        </>
    );
}

// ===== HELPER FUNCTIONS =====

function getModalTitle(type: string | null): string {
    const titles: Record<string, string> = {
        aprobar: 'Aprobar Instalación',
        rechazar: 'Rechazar Instalación',
        usuario: 'Crear Usuario B2B',
        equipo: 'Gestionar Equipo',
        agendar: 'Agendar Instalación',
        instalar: 'Marcar como Instalado',
        finalizar: 'Finalizar Instalación',
    };
    return titles[type || ''] || 'Acción';
}

// ===== COMPONENTES DE FORMULARIOS =====

function AprobarForm({ mutation, close }: { mutation: any; close: () => void }) {
    return (
        <Box>
            <Text mb="md">¿Está seguro de aprobar esta instalación?</Text>
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button color="green" loading={mutation.isPending} onClick={() => mutation.mutate()}>Aprobar</Button>
            </Group>
        </Box>
    );
}

function RechazarForm({ mutation, close }: { mutation: any; close: () => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<RechazarFormValues>({
        resolver: zodResolver(rechazarSchema),
    });

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data.observaciones))}>
            <Textarea
                label="Motivo del Rechazo"
                placeholder="Explique por qué se rechaza la instalación..."
                {...register('observaciones')}
                error={errors.observaciones?.message}
                minRows={4}
                required
            />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" color="red" loading={mutation.isPending}>Rechazar</Button>
            </Group>
        </form>
    );
}

function CrearUsuarioForm({ mutation, close }: { mutation: any; close: () => void }) {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<CrearUsuarioFormValues>({
        resolver: zodResolver(crearUsuarioSchema),
        defaultValues: { 
            nombre_completo: '',
            usuario: '',
            email: '',
            password: '',
            existe_en_sistema: false,
            existe_en_corp: false
        },
    });

    const existeEnSistema = watch('existe_en_sistema');

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <Text size="sm" c="dimmed" mb="md">
                Complete los datos del usuario B2B a crear o vincular
            </Text>
            
            <Switch
                label="El usuario ya existe en mi sistema"
                {...register('existe_en_sistema')}
                mb="sm"
            />
            
            <Switch
                label="El usuario ya existe en el portal Corp"
                {...register('existe_en_corp')}
                mb="md"
            />

            {!existeEnSistema ? (
                <>
                    <TextInput
                        label="Nombre Completo"
                        placeholder="Ej: Juan Pérez"
                        {...register('nombre_completo')}
                        error={errors.nombre_completo?.message}
                        required
                        mb="sm"
                    />
                    
                    <TextInput
                        label="Usuario"
                        placeholder="Ej: juanp1"
                        {...register('usuario')}
                        error={errors.usuario?.message}
                        description="Se generará automáticamente la contraseña: {usuario}.,{año}.*"
                        required
                        mb="sm"
                    />
                    
                    <TextInput
                        label="Email"
                        placeholder="usuario@empresa.com"
                        type="email"
                        {...register('email')}
                        error={errors.email?.message}
                        required
                        mb="sm"
                    />
                </>
            ) : (
                <Text c="orange" size="sm" mb="md">
                    ⚠️ Funcionalidad de vincular usuario existente pendiente de implementar
                </Text>
            )}

            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending} disabled={existeEnSistema}>
                    Crear Usuario
                </Button>
            </Group>
        </form>
    );
}

function AgendarForm({ mutation, close }: { mutation: any; close: () => void }) {
    const { control, register, handleSubmit } = useForm<AgendarFormValues>({
        resolver: zodResolver(agendarSchema),
        defaultValues: { fecha_visita: new Date() },
    });

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <Text size="sm" c="dimmed" mb="md">
                Programe una fecha y hora para realizar la instalación en el cliente.
            </Text>
            <FechaHoraController control={control} name="fecha_visita" label="Fecha de Visita Programada" />
            <Textarea label="Observaciones (opcional)" {...register('observaciones')} mt="md" minRows={3} />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Agendar</Button>
            </Group>
        </form>
    );
}

function InstalarForm({ mutation, close }: { mutation: any; close: () => void }) {
    const { control, register, handleSubmit } = useForm<InstalarFormValues>({
        resolver: zodResolver(instalarSchema),
        defaultValues: { fecha_instalacion: new Date() },
    });

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <FechaHoraController control={control} name="fecha_instalacion" label="Fecha de Instalación" />
            <Textarea label="Observaciones (opcional)" {...register('observaciones')} mt="md" minRows={3} />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Marcar Instalado</Button>
            </Group>
        </form>
    );
}

function FinalizarForm({ mutation, close }: { mutation: any; close: () => void }) {
    const { register, handleSubmit, watch, setValue } = useForm<FinalizarFormValues>({
        resolver: zodResolver(finalizarSchema),
        defaultValues: { capacitacion_realizada: true },
    });

    const capacitacionRealizada = watch('capacitacion_realizada');

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data.capacitacion_realizada))}>
            <Text size="md" mb="md">
                ¿Se realizó la capacitación correspondiente al cliente?
            </Text>
            
            <Radio.Group 
                name="capacitacion_realizada"
                value={capacitacionRealizada ? 'si' : 'no'}
                onChange={(value) => setValue('capacitacion_realizada', value === 'si')}
            >
                <Stack gap="sm">
                    <Radio 
                        value="si" 
                        label="👍 Sí, fue realizada"
                    />
                    <Radio 
                        value="no" 
                        label="👎 No, no fue requerida"
                    />
                </Stack>
            </Radio.Group>
            
            <Group justify="flex-end" mt="xl">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" color="blue" loading={mutation.isPending}>
                    Confirmar Finalización
                </Button>
            </Group>
        </form>
    );
}

// ===== GESTIONAR EQUIPO =====

function GestionarEquipoForm({ instalacion, onUpdate, close }: { instalacion: Instalacion; onUpdate: (i: Instalacion) => void; close: () => void }) {
    const [equipos, setEquipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEquipo, setSelectedEquipo] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            nombre_equipo: '',
            mac_address: '',
            procesador: '',
            placa_madre: '',
            disco_duro: ''
        }
    });

    const handleSincronizar = async () => {
        setLoading(true);
        try {
            const result = await sincronizarEquipos(instalacion.id_instalacion);
            setEquipos(result.equipos || []);
            showNotification({ title: 'Éxito', message: `${result.equipos?.length || 0} equipos sincronizados`, color: 'blue' });
        } catch (error: any) {
            showNotification({ title: 'Error', message: error.response?.data?.error || 'Error al sincronizar', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleCrearEquipo = async (data: any) => {
        setLoading(true);
        try {
            const nuevoEquipo = await crearEquipoInstalacion(instalacion.id_instalacion, data);
            showNotification({ title: 'Éxito', message: 'Equipo creado exitosamente', color: 'green' });
            setEquipos([...equipos, nuevoEquipo]);
            setShowCreateForm(false);
        } catch (error: any) {
            showNotification({ title: 'Error', message: error.response?.data?.error || 'Error al crear equipo', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleActivarEInstalar = async () => {
        if (!selectedEquipo) return;
        
        setLoading(true);
        try {
            // Paso 1: Activar equipo
            await activarEquipo(instalacion.id_instalacion, selectedEquipo);
            
            // Paso 2: Instalar equipo
            const updated = await instalarEquipo(instalacion.id_instalacion, selectedEquipo);
            
            queryClient.setQueryData(['instalacion', instalacion.id_instalacion], updated);
            onUpdate(updated);
            showNotification({ title: 'Éxito', message: 'Equipo activado e instalación completada', color: 'green' });
            close();
        } catch (error: any) {
            showNotification({ title: 'Error', message: error.response?.data?.error || 'Error en el proceso', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Group mb="md">
                <Button onClick={handleSincronizar} variant="light" loading={loading}>
                    Sincronizar desde Corp
                </Button>
                <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline">
                    {showCreateForm ? 'Cancelar' : 'Crear Equipo Nuevo'}
                </Button>
            </Group>

            {showCreateForm && (
                <Paper withBorder p="md" mb="md">
                    <Title order={5} mb="sm">Nuevo Equipo</Title>
                    <form onSubmit={handleSubmit(handleCrearEquipo)}>
                        <TextInput label="Nombre del Equipo" placeholder="PC-OFICINA-01" {...register('nombre_equipo', { required: true })} mb="xs" />
                        <TextInput label="Dirección MAC" placeholder="00:1B:63:84:45:E6" {...register('mac_address', { required: true })} mb="xs" />
                        <TextInput label="Procesador" placeholder="Intel Core i5-9400" {...register('procesador', { required: true })} mb="xs" />
                        <TextInput label="Placa Madre" placeholder="ASUS PRIME B365M-A" {...register('placa_madre', { required: true })} mb="xs" />
                        <TextInput label="Disco Duro" placeholder="Kingston 240GB SSD" {...register('disco_duro', { required: true })} mb="xs" />
                        <Button type="submit" fullWidth mt="sm" loading={loading}>Crear Equipo</Button>
                    </form>
                </Paper>
            )}

            <Divider my="md" label="Equipos Disponibles" />

            {loading && <Loader />}
            
            {equipos.length === 0 && !loading && (
                <Alert color="blue">No hay equipos. Sincronice desde Corp o cree uno nuevo.</Alert>
            )}

            {equipos.length > 0 && (
                <Radio.Group value={selectedEquipo?.toString()} onChange={(val) => setSelectedEquipo(Number(val))}>
                    <Stack gap="sm">
                        {equipos.map((eq: any) => (
                            <Paper key={eq.id_equipo} withBorder p="sm">
                                <Radio
                                    value={eq.id_equipo.toString()}
                                    label={
                                        <Box>
                                            <Group gap="xs">
                                                <Text fw={600}>{eq.equipo}</Text>
                                                <Badge color={eq.estado ? 'green' : 'gray'} size="sm">
                                                    {eq.estado ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                                <Badge color={eq.alta === 'Aprobado' ? 'green' : eq.alta === 'Rechazado' ? 'red' : 'yellow'} size="sm">
                                                    {eq.alta_str || eq.alta}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed">MAC: {eq.mac}</Text>
                                            <Text size="xs" c="dimmed">Procesador: {eq.procesador}</Text>
                                            <Text size="xs" c="dimmed">Placa: {eq.placa}</Text>
                                            <Text size="xs" c="dimmed">Disco: {eq.disco}</Text>
                                        </Box>
                                    }
                                />
                            </Paper>
                        ))}
                    </Stack>
                </Radio.Group>
            )}

            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button 
                    onClick={handleActivarEInstalar} 
                    disabled={!selectedEquipo} 
                    loading={loading}
                    color="blue"
                >
                    Activar e Instalar Equipo
                </Button>
            </Group>
        </Box>
    );
}

// ===== COMPONENTE REUTILIZABLE PARA FECHA Y HORA =====

function FechaHoraController({ control, name, label }: { control: any; name: string; label: string }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentDate = field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : new Date();
                
                const handleDatePartChange = (valueFromInput: Date | null) => {
                    if (!valueFromInput) return;
                    const datePart = new Date(valueFromInput);
                    if (datePart && !isNaN(datePart.getTime())) {
                        const newFullDate = new Date(
                            datePart.getFullYear(),
                            datePart.getMonth(),
                            datePart.getDate(),
                            currentDate.getHours(),
                            currentDate.getMinutes()
                        );
                        field.onChange(newFullDate);
                    }
                };

                const handleTimePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const [hours, minutes] = e.currentTarget.value.split(':');
                    if (!isNaN(parseInt(hours, 10)) && !isNaN(parseInt(minutes, 10))) {
                        const newFullDate = new Date(currentDate);
                        newFullDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                        field.onChange(newFullDate);
                    }
                };

                const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

                return (
                    <Group grow mt="md">
                        <DateInput value={currentDate} onChange={handleDatePartChange} label={label} required />
                        <TimeInput value={timeValue} onChange={handleTimePartChange} label="Hora" required />
                    </Group>
                );
            }}
        />
    );
}


// frontend/src/features/pedidos/components/PedidoActionPanel.tsx
import { useState } from 'react';
import { Paper, Title, Button, Group, Modal, Select, Textarea, TextInput, Switch, Tooltip, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Pedido, PedidoUpdateEstadoPayload } from '../types';
import { updatePedidoEstado, updateEstadoLogistico, marcarFacturado, marcarEntregado, cerrarFaseLogisticaActual, actualizarNumeroSap } from '../services/pedidoService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showNotification } from '@mantine/notifications';

// --- SCHEMAS DE VALIDACIÓN ---
const creditValidationSchema = z.object({
    nuevo_estado_id: z.string().min(1, 'Debe seleccionar una decisión'),
    observaciones: z.string().min(5, 'Debe ingresar una observación.'),
    fecha_evento: z.coerce.date(),
    numero_pedido_sap: z.string().optional(),
}).superRefine((val, ctx) => {
    // Si el estado elegido es Aprobado (id '2'), exigir el número SAP
    if (val.nuevo_estado_id === '2' && (!val.numero_pedido_sap || val.numero_pedido_sap.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['numero_pedido_sap'], message: 'Requerido al aprobar crédito' });
    }
});
type CreditFormValues = z.infer<typeof creditValidationSchema>;

const facturaSchema = z.object({
    factura_manual: z.boolean(),
    numero_factura_sap: z.string().optional(),
    observaciones: z.string().min(5, 'La observación es requerida.'),
});
type FacturaFormValues = z.infer<typeof facturaSchema>;

const entregaSchema = z.object({
    observaciones: z.string().min(5, 'La observación es requerida.'),
    fecha_evento: z.coerce.date(),
});
type EntregaFormValues = z.infer<typeof entregaSchema>;

const confirmacionLogisticaSchema = z.object({
    observaciones: z.string().optional(),
    fecha_evento: z.coerce.date(),
});
type ConfirmacionLogisticaValues = z.infer<typeof confirmacionLogisticaSchema>;

// --- CONSTANTES ---
const ESTADOS_LOGISTICOS_IDS = {
    PENDIENTE_WMS: 1, CREADO: 2, LIBERADO: 3, PICKING: 4,
    EMBALAJE: 5, ANDEN: 6, DESPACHADO: 7, ENTREGADO: 8, NO_APLICA: 9,
};

const ESTADOS_GENERALES_IDS = {
    NUEVO: 1,
    EN_PROCESO: 2,
    RETENIDO: 3,
    COMPLETADO: 4,
    CANCELADO: 5,
};

interface PedidoActionPanelProps {
    pedido: Pedido;
    onUpdate: (updatedPedido: Pedido) => void;
}

export function PedidoActionPanel({ pedido, onUpdate }: PedidoActionPanelProps) {
    const queryClient = useQueryClient();

    const [specificModalType, setSpecificModalType] = useState<'factura' | 'entrega' | null>(null);
    const [specificModalOpened, { open: openSpecificModal, close: closeSpecificModal }] = useDisclosure(false);
    const [creditModalOpened, { open: openCreditModal, close: closeCreditModal }] = useDisclosure(false);
    const [confirmacion, setConfirmacion] = useState<{ idEstado: number, nombreAccion: string } | null>(null);
    const [confirmacionModalOpened, { open: openConfirmacionModal, close: closeConfirmacionModal }] = useDisclosure(false);
    const [confirmacionGeneral, setConfirmacionGeneral] = useState<{ idEstado: number, nombreAccion: string } | null>(null);
    const [confirmacionGeneralModalOpened, { open: openConfirmacionGeneralModal, close: closeConfirmacionGeneralModal }] = useDisclosure(false);
    const [closePhaseModalOpen, setClosePhaseModalOpen] = useState(false);
    const [sapModalOpen, setSapModalOpen] = useState(false);

    // --- MUTATIONS ---
    const estadoLogisticoMutation = useMutation({
        mutationFn: (payload: { id_estado_logistico: number, fecha_evento: string, observaciones?: string }) => 
            updateEstadoLogistico(pedido.id_pedido, payload),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedido.id_pedido], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Estado logístico actualizado.', color: 'green' });
            closeConfirmacionModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' })
    });

    const cerrarFaseMutation = useMutation({
        mutationFn: (data: { fecha_evento_fin: string; observaciones?: string }) =>
            cerrarFaseLogisticaActual(pedido.id_pedido, data),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedido.id_pedido], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Fase cerrada correctamente.', color: 'green' });
            closeConfirmacionModal();
        },
        onError: (error: any) => {
            const apiMsg = error?.response?.data?.error || (typeof error?.response?.data === 'string' ? error.response.data : null);
            const message = apiMsg || error?.message || 'Error al cerrar la fase';
            showNotification({ title: 'Error', message, color: 'red' });
        }
    });

    const actualizarSapMutation = useMutation({
        mutationFn: (data: { numero_pedido_sap: string }) =>
            actualizarNumeroSap(pedido.id_pedido, data),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedido.id_pedido], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Número SAP actualizado correctamente.', color: 'green' });
            setSapModalOpen(false);
        },
        onError: (error: any) => {
            const apiMsg = error?.response?.data?.error || (typeof error?.response?.data === 'string' ? error.response.data : null);
            const message = apiMsg || error?.message || 'Error al actualizar número SAP';
            showNotification({ title: 'Error', message, color: 'red' });
        }
    });

    const facturaMutation = useMutation({
        mutationFn: (data: FacturaFormValues) => marcarFacturado(pedido.id_pedido, data),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedido.id_pedido], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Factura registrada.', color: 'green' });
            closeSpecificModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' })
    });

    const entregaMutation = useMutation({
        mutationFn: (data: EntregaFormValues) => marcarEntregado(pedido.id_pedido, { ...data, fecha_evento: data.fecha_evento.toISOString() }),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedido.id_pedido], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Entrega confirmada.', color: 'green' });
            closeSpecificModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' })
    });

    const estadoGeneralMutation = useMutation({
        mutationFn: (payload: { id_estado_general: number, fecha_evento: string, observaciones?: string }) =>
            updatePedidoEstado(pedido.id_pedido, payload as any),
        onSuccess: (updatedPedido) => {
            queryClient.setQueryData(['pedido', pedido.id_pedido], updatedPedido);
            onUpdate(updatedPedido);
            showNotification({ title: 'Éxito', message: 'Estado general actualizado.', color: 'green' });
            closeConfirmacionGeneralModal();
        },
        onError: (error: any) => showNotification({ title: 'Error', message: error.message, color: 'red' })
    });

    const handleOpenConfirmacionModal = (idEstado: number, nombreAccion: string) => {
        setConfirmacion({ idEstado, nombreAccion });
        openConfirmacionModal();
    };

    // Solo controlamos apertura/cierre del modal; el formulario vive en CreditForm

    const renderAcciones = () => {
        const estadoGeneral = pedido.estado_general?.codigo_estado;

        if (estadoGeneral === 'CANCELADO') {
            return <p>Pedido cancelado. No es posible realizar más acciones.</p>;
        }
        if (estadoGeneral === 'RETENIDO') {
            return <p>Pedido retenido. Actívelo para continuar con el proceso.</p>;
        }

        if (pedido.estado_credito.codigo_estado === 'PENDIENTE') {
            return <Button onClick={openCreditModal}>Gestionar Crédito</Button>;
        }
        if (pedido.estado_credito.codigo_estado !== 'APROBADO') {
            return <p>El pedido no está aprobado por crédito.</p>;
        }

        // Si está aprobado pero no tiene número SAP, mostrar botón para registrarlo
        const necesitaSap = pedido.estado_credito.codigo_estado === 'APROBADO' && !pedido.numero_pedido_sap;

        const codigoEstadoActual = pedido.estado_logistico?.codigo_estado ?? null;

        const tieneCierre = (fase: 'PICKING' | 'EMBALAJE') => {
            // Si el pedido está en la fase que queremos verificar, buscar el historial por el nombre del estado actual
            if (pedido.estado_logistico && pedido.estado_logistico.codigo_estado === fase) {
                const nombreEstadoActual = pedido.estado_logistico.nombre_estado;
                const hist = [...(pedido.historial_estados || [])].reverse().find(h => 
                    h.tipo_estado === 'LOGISTICO' && h.estado_nuevo === nombreEstadoActual
                );
                return !!(hist && hist.fecha_evento_fin);
            }
            return false;
        };

        const renderAccionesLogisticas = () => {
            switch (codigoEstadoActual) {
                case null:
                    return <Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.PENDIENTE_WMS, 'Enviar a Bodega')}>Enviar a Bodega</Button>;
                case 'PENDIENTE_WMS':
                    return <Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.CREADO, 'Crear en Bodega')}>Crear en Bodega</Button>;
                case 'CREADO':
                    return <Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.LIBERADO, 'Liberar Pedido')}>Liberar Pedido</Button>;
                case 'LIBERADO':
                    return <Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.PICKING, 'Iniciar Picking')}>Iniciar Picking</Button>;
                case 'PICKING':
                    const pickingCerrado = tieneCierre('PICKING');
                    return (
                        <Group>
                            {!pickingCerrado && (
                                <Button variant="default" onClick={() => setClosePhaseModalOpen(true)}>Finalizar Picking</Button>
                            )}
                            <Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.EMBALAJE, 'Iniciar Embalaje')} disabled={!pickingCerrado}>Iniciar Embalaje</Button>
                        </Group>
                    );
                case 'EMBALAJE':
                    const embalajeCerrado = tieneCierre('EMBALAJE');
                     return (
                        <Group>
                            {!embalajeCerrado && (
                                <Button variant="default" onClick={() => setClosePhaseModalOpen(true)}>Finalizar Embalaje</Button>
                            )}
                            <Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.ANDEN, 'Mover a Andén')} disabled={!embalajeCerrado}>Mover a Andén</Button>
                        </Group>
                     );
                case 'ANDEN':
                    const puedeDespachar = !!pedido.numero_factura_sap || pedido.factura_manual === true;
                    return (
                         <Group>
                            {!puedeDespachar && (
                                <Button color="cyan" onClick={() => { setSpecificModalType('factura'); openSpecificModal(); }}>Registrar Factura</Button>
                            )}
                            <Tooltip label={!puedeDespachar ? "Se debe registrar la factura" : ""}>
                               <Box><Button onClick={() => handleOpenConfirmacionModal(ESTADOS_LOGISTICOS_IDS.DESPACHADO, 'Despachar Pedido')} disabled={!puedeDespachar}>Despachar</Button></Box>
                            </Tooltip>
                         </Group>
                    );
                case 'DESPACHADO':
                    return <Button color="green" onClick={() => { setSpecificModalType('entrega'); openSpecificModal(); }}>Confirmar Entrega</Button>;
                case 'ENTREGADO':
                    return <p>✅ Pedido finalizado.</p>;
                default:
                    return <p>Estado no reconocido.</p>;
            }
        };

        // Si necesita SAP, mostrar botón SAP junto con las acciones logísticas
        if (necesitaSap) {
            return (
                <Group>
                    <Button color="orange" onClick={() => setSapModalOpen(true)}>Registrar Número SAP</Button>
                    {renderAccionesLogisticas()}
                </Group>
            );
        }

        return renderAccionesLogisticas();
    };

    const renderAccionesGenerales = () => {
        const codigoGeneral = pedido.estado_general?.codigo_estado;
        const esRetenido = codigoGeneral === 'RETENIDO';
        const esCancelado = codigoGeneral === 'CANCELADO';

        const handleOpenGeneral = (idEstado: number, nombreAccion: string) => {
            setConfirmacionGeneral({ idEstado, nombreAccion });
            openConfirmacionGeneralModal();
        };

        return (
            <Group>
                <Button
                    color={esRetenido ? 'teal' : 'yellow'}
                    onClick={() => handleOpenGeneral(esRetenido ? ESTADOS_GENERALES_IDS.EN_PROCESO : ESTADOS_GENERALES_IDS.RETENIDO, esRetenido ? 'Activar Pedido' : 'Retener Pedido')}
                    disabled={esCancelado}
                >
                    {esRetenido ? 'Activar Pedido' : 'Retener Pedido'}
                </Button>
                <Tooltip label={esCancelado ? 'El pedido ya está cancelado' : 'Esta acción no se puede deshacer'}>
                    <Box>
                        <Button
                            color="red"
                            variant="filled"
                            onClick={() => handleOpenGeneral(ESTADOS_GENERALES_IDS.CANCELADO, 'Cancelar Pedido')}
                            disabled={esCancelado}
                        >
                            Cancelar Pedido
                        </Button>
                    </Box>
                </Tooltip>
            </Group>
        );
    };

    return (
        <>
            <Paper withBorder p="lg">
                <Title order={4} mb="md">Acciones Posibles</Title>
                <Group>{renderAcciones()}</Group>
            </Paper>

            <Paper withBorder p="lg" mt="md">
                <Title order={4} mb="md">Estado General</Title>
                {renderAccionesGenerales()}
            </Paper>

            <Modal opened={confirmacionModalOpened} onClose={closeConfirmacionModal} title={confirmacion?.nombreAccion || 'Confirmar Acción'} centered>
                <ConfirmacionLogisticaForm mutation={estadoLogisticoMutation} idEstado={confirmacion?.idEstado} close={closeConfirmacionModal} />
            </Modal>

            <Modal opened={closePhaseModalOpen} onClose={() => setClosePhaseModalOpen(false)} title="Finalizar Fase" centered>
                <CerrarFaseForm mutation={cerrarFaseMutation} close={() => setClosePhaseModalOpen(false)} />
            </Modal>

            <Modal opened={specificModalOpened} onClose={closeSpecificModal} title={specificModalType === 'factura' ? "Registrar Factura" : "Confirmar Entrega"} centered>
                {specificModalType === 'factura' && <FacturaForm mutation={facturaMutation} close={closeSpecificModal} />}
                {specificModalType === 'entrega' && <EntregaForm mutation={entregaMutation} close={closeSpecificModal} />}
            </Modal>

            <Modal opened={creditModalOpened} onClose={closeCreditModal} title="Gestionar Crédito del Pedido" centered>
                <CreditForm pedido={pedido} onUpdate={onUpdate} close={closeCreditModal} />
            </Modal>

            <Modal opened={confirmacionGeneralModalOpened} onClose={closeConfirmacionGeneralModal} title={confirmacionGeneral?.nombreAccion || 'Confirmar Acción'} centered>
                <ConfirmacionLogisticaForm
                    mutation={{
                        mutate: (data: { fecha_evento: string; observaciones?: string }) =>
                            estadoGeneralMutation.mutate({
                                id_estado_general: confirmacionGeneral?.idEstado as number,
                                fecha_evento: data.fecha_evento,
                                observaciones: data.observaciones,
                            }),
                        isPending: estadoGeneralMutation.isPending,
                    }}
                    idEstado={confirmacionGeneral?.idEstado}
                    close={closeConfirmacionGeneralModal}
                />
            </Modal>

            <Modal opened={sapModalOpen} onClose={() => setSapModalOpen(false)} title="Registrar Número SAP" centered>
                <SapForm mutation={actualizarSapMutation} close={() => setSapModalOpen(false)} />
            </Modal>
        </>
    );
}

function FacturaForm({ mutation, close }: { mutation: any, close: () => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<FacturaFormValues>({
        resolver: zodResolver(facturaSchema),
        defaultValues: { factura_manual: false, observaciones: `Facturación para pedido` }
    });
    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <Switch label="¿La factura fue manual?" {...register('factura_manual')} mb="md" />
            <TextInput label="Nº Factura SAP (si aplica)" {...register('numero_factura_sap')} mb="md" />
            <Textarea label="Observaciones" {...register('observaciones')} error={errors.observaciones?.message} minRows={3} mb="md" required />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Guardar Factura</Button>
            </Group>
        </form>
    );
}

function EntregaForm({ mutation, close }: { mutation: any, close: () => void }) {
    const { control, register, handleSubmit, formState: { errors } } = useForm<EntregaFormValues>({
        resolver: zodResolver(entregaSchema) as any,
        defaultValues: { fecha_evento: new Date(), observaciones: 'Pedido entregado conforme.' }
    });
    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <Controller
                name="fecha_evento"
                control={control}
                render={({ field }) => (
                    <TextInput
                        type="date"
                        label="Fecha de Entrega"
                        value={field.value.toISOString().split('T')[0]}
                        onChange={(e) => {
                            // Prevenir fecha inválida si el campo está vacío
                            const date = e.currentTarget.value ? new Date(e.currentTarget.value) : new Date();
                            field.onChange(date);
                        }}
                        mb="md"
                        required
                    />
                )}
            />
            <Textarea label="Observaciones" {...register('observaciones')} error={errors.observaciones?.message} minRows={3} mb="md" required />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Confirmar Entrega</Button>
            </Group>
        </form>
    );
}

function CreditForm({ pedido, onUpdate, close }: { pedido: Pedido; onUpdate: (p: Pedido) => void; close: () => void; }) {
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreditFormValues>({
        resolver: zodResolver(creditValidationSchema) as unknown as import('react-hook-form').Resolver<CreditFormValues>,
        defaultValues: { fecha_evento: new Date(), observaciones: '', nuevo_estado_id: '' }
    });

    const onCreditSubmit: SubmitHandler<CreditFormValues> = async (data) => {
        const payload: PedidoUpdateEstadoPayload = {
            id_estado_credito: Number(data.nuevo_estado_id),
            observaciones: data.observaciones,
            fecha_evento: data.fecha_evento.toISOString(),
            numero_pedido_sap: data.nuevo_estado_id === '2' ? (data.numero_pedido_sap || undefined) : undefined,
        };
        try {
            const updatedPedido = await updatePedidoEstado(pedido.id_pedido, payload);
            onUpdate(updatedPedido);
            close();
            showNotification({ title: 'Éxito', message: 'Decisión de crédito guardada.', color: 'blue' });
        } catch (error: any) {
            showNotification({ title: 'Error', message: error.message, color: 'red' });
        }
    };

    return (
        <form onSubmit={handleSubmit(onCreditSubmit)}>
            <Controller name="nuevo_estado_id" control={control} render={({ field }) => (
                <Select label="Decisión de Crédito" placeholder="Seleccione una opción" data={[{ value: '2', label: 'Aprobado' }, { value: '3', label: 'Rechazado' }]} {...field} error={errors.nuevo_estado_id?.message} mb="md" required/>
            )}/>
            {/** Campo condicional para número de pedido SAP al aprobar **/}
            <Controller name="numero_pedido_sap" control={control} render={({ field }) => (
                <TextInput label="Número de Orden SAP" placeholder="Ingrese Nº de Orden SAP (obligatorio si aprueba)" {...field} error={errors.numero_pedido_sap?.message} mb="md" />
            )}/>
            <FechaHoraController control={control} name="fecha_evento" />
            <Textarea label="Observaciones" placeholder="Motivo de la aprobación o rechazo" {...control.register('observaciones')} error={errors.observaciones?.message} minRows={3} mt="md" required/>
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={isSubmitting}>Guardar Decisión</Button>
            </Group>
        </form>
    );
}

function ConfirmacionLogisticaForm({ mutation, idEstado, close }: { mutation: any, idEstado?: number, close: () => void }) {
    const { control, register, handleSubmit } = useForm<ConfirmacionLogisticaValues>({
        resolver: zodResolver(confirmacionLogisticaSchema) as unknown as import('react-hook-form').Resolver<ConfirmacionLogisticaValues>,
        defaultValues: { fecha_evento: new Date(), observaciones: '' }
    });

    const onSubmit: SubmitHandler<ConfirmacionLogisticaValues> = (data) => {
        if (typeof mutation?.mutate !== 'function') return;
        const fechaIso = data.fecha_evento instanceof Date ? data.fecha_evento.toISOString() : new Date(data.fecha_evento as any).toISOString();
        // Para mutaciones logísticas, se pasa id_estado_logistico; para generales, el wrapper ya formatea el payload
        if (idEstado) {
            mutation.mutate({ 
                id_estado_logistico: idEstado, 
                fecha_evento: fechaIso, 
                observaciones: data.observaciones 
            });
        } else {
            mutation.mutate({
                fecha_evento: fechaIso,
                observaciones: data.observaciones,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FechaHoraController control={control} name="fecha_evento" />
            <Textarea label="Observaciones (Opcional)" {...register('observaciones')} mt="md" />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Confirmar</Button>
            </Group>
        </form>
    );
}

function CerrarFaseForm({ mutation, close }: { mutation: any, close: () => void }) {
    const { control, register, handleSubmit } = useForm<{ fecha_evento_fin: Date; observaciones?: string }>({
        defaultValues: { fecha_evento_fin: new Date(), observaciones: '' }
    });

    const onSubmit: SubmitHandler<{ fecha_evento_fin: Date; observaciones?: string }> = (data) => {
        const fechaIso = data.fecha_evento_fin instanceof Date ? data.fecha_evento_fin.toISOString() : new Date(data.fecha_evento_fin as any).toISOString();
        mutation.mutate({ fecha_evento_fin: fechaIso, observaciones: data.observaciones });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FechaHoraController control={control} name="fecha_evento_fin" />
            <Textarea label="Observaciones (Opcional)" {...register('observaciones')} mt="md" />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Finalizar</Button>
            </Group>
        </form>
    );
}

function SapForm({ mutation, close }: { mutation: any, close: () => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm<{ numero_pedido_sap: string }>({
        defaultValues: { numero_pedido_sap: '' }
    });

    const onSubmit: SubmitHandler<{ numero_pedido_sap: string }> = (data) => {
        mutation.mutate({ numero_pedido_sap: data.numero_pedido_sap.trim() });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
                label="Número de Pedido SAP"
                placeholder="Ej: 10349749"
                {...register('numero_pedido_sap', { required: 'El número SAP es requerido' })}
                error={errors.numero_pedido_sap?.message}
                mb="md"
                required
            />
            <Group justify="flex-end" mt="lg">
                <Button variant="default" onClick={close}>Cancelar</Button>
                <Button type="submit" loading={mutation.isPending}>Guardar</Button>
            </Group>
        </form>
    );
}

function FechaHoraController({ control, name }: { control: any, name: string }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentDate = field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : new Date();
                
                // Formato YYYY-MM-DD para el input date
                const dateValue = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                
                const handleDatePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const dateStr = e.currentTarget.value; // YYYY-MM-DD
                    if (!dateStr) return;
                    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                    // Crear fecha local sin problemas de zona horaria
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
                            label="Fecha del Evento" 
                            required 
                        />
                        <TextInput 
                            type="time" 
                            value={timeValue} 
                            onChange={handleTimePartChange} 
                            label="Hora del Evento" 
                            required 
                        />
                    </Group>
                );
            }}
        />
    );
}

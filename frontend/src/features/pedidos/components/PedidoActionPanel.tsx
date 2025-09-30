// frontend/src/features/pedidos/components/PedidoActionPanel.tsx
import { useState } from 'react';
import { Paper, Title, Button, Group, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { TimeInput } from '@mantine/dates'; 
import { useDisclosure } from '@mantine/hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Pedido, PedidoUpdateEstadoPayload } from '../types';
import { updatePedidoEstado } from '../services/pedidoService';
// Asumimos que tienes servicios para obtener los posibles estados
// import { getEstadosCredito } from '../../estados/services/estadoCreditoService';
// import { getEstadosLogisticos } from '../../estados/services/estadoLogisticoService';

const validationSchema = z.object({
    nuevo_estado_id: z.string().min(1, 'Debe seleccionar un nuevo estado'),
    observaciones: z.string().min(5, 'Debe ingresar una observación de al menos 5 caracteres'),
    // Acepta Date o string y lo convierte a Date
    fecha_evento: z.coerce.date().refine((d) => d instanceof Date && !isNaN(d.getTime()), {
        message: 'Debe seleccionar una fecha y hora',
    }),
});

type FormValues = z.infer<typeof validationSchema>;

interface PedidoActionPanelProps {
    pedido: Pedido;
    onUpdate: (updatedPedido: Pedido) => void;
}

export function PedidoActionPanel({ pedido, onUpdate }: PedidoActionPanelProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const [actionType, setActionType] = useState<'CREDITO' | 'LOGISTICO' | null>(null);
    const [possibleStates, setPossibleStates] = useState<{ value: string, label: string }[]>([]);

    const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
        resolver: zodResolver(validationSchema) as any,
        defaultValues: {
            fecha_evento: new Date() // Por defecto, la hora actual
        }
    });

    // Lógica para determinar qué acciones mostrar
    const puedeAprobarCredito = pedido.estado_credito.codigo_estado === 'PENDIENTE';
    const puedeEnviarABodega = pedido.estado_credito.codigo_estado === 'APROBADO' && !pedido.estado_logistico;
    // ... aquí irían más reglas de negocio ...

    const handleOpenModal = (type: 'CREDITO' | 'LOGISTICO') => {
        setActionType(type);
        // Aquí cargarías los estados posibles desde tu API
        // Por ahora, simulamos con datos de ejemplo
        if (type === 'CREDITO') {
            setPossibleStates([
                { value: '2', label: 'Aprobado' }, // Asumiendo ID 2 = Aprobado
                { value: '3', label: 'Rechazado' }, // Asumiendo ID 3 = Rechazado
            ]);
        } else if (type === 'LOGISTICO') {
            setPossibleStates([
                { value: '1', label: 'Pendiente de Ingreso a Bodega' }, // Asumiendo IDs de estados logísticos
                 // ... otros estados
            ]);
        }
        open();
    };

    const onSubmit = async (data: FormValues) => {
        const payload: PedidoUpdateEstadoPayload = {
            observaciones: data.observaciones,
            fecha_evento: new Date(data.fecha_evento).toISOString(),
        };
        if (actionType === 'CREDITO') {
            const id = Number(data.nuevo_estado_id);
            if (!Number.isNaN(id)) payload.id_estado_credito = id;
        } else if (actionType === 'LOGISTICO') {
            const id = Number(data.nuevo_estado_id);
            if (!Number.isNaN(id)) payload.id_estado_logistico = id;
        }

        try {
            console.log('[PedidoActionPanel] Enviando payload corregido al backend:', payload); // <-- Log adicional para confirmar
            const updatedPedido = await updatePedidoEstado(pedido.id_pedido, payload);
            
            console.log('[PedidoActionPanel] Respuesta exitosa del backend:', updatedPedido);
            onUpdate(updatedPedido); // Actualiza el estado en la página padre
            reset();
            close();
        } catch (error: any) {
            console.error("Error al actualizar estado:", error);
        }
    };

    return (
        <>
            <Paper withBorder p="lg">
                <Title order={4} mb="md">Acciones Posibles</Title>
                <Group>
                    {puedeAprobarCredito && (
                        <Button onClick={() => handleOpenModal('CREDITO')}>Gestionar Crédito</Button>
                    )}
                    {puedeEnviarABodega && (
                        <Button onClick={() => handleOpenModal('LOGISTICO')}>Enviar a Bodega</Button>
                    )}
                    {/* Aquí irían más botones condicionales */}
                </Group>
            </Paper>

            <Modal opened={opened} onClose={close} title={`Actualizar Estado de ${actionType}`}>
                <form onSubmit={handleSubmit(onSubmit as any)}>
                    <Controller
                        name="nuevo_estado_id"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Nuevo Estado"
                                placeholder="Seleccione el nuevo estado"
                                data={possibleStates}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                error={errors.nuevo_estado_id?.message}
                                mb="md"
                            />
                        )}
                    />
                    <Controller
                        name="fecha_evento"
                        control={control}
                        render={({ field }) => {
                            const current = field.value ? new Date(field.value) : new Date();
                            const hours = String(current.getHours()).padStart(2, '0');
                            const minutes = String(current.getMinutes()).padStart(2, '0');

                            const applyTime = (val: string) => {
                                const [h, m] = val.split(':').map((n) => parseInt(n, 10));
                                if (Number.isFinite(h) && Number.isFinite(m)) {
                                    const d = new Date(current);
                                    d.setHours(h, m, 0, 0);
                                    field.onChange(d);
                                }
                            };

                            return (
                                <Group grow align="flex-end" mb="md">
                                    <TextInput
                                        label="Fecha del Evento"
                                        placeholder="Selecciona la fecha"
                                        type="date"
                                        value={`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`}
                                        onChange={(e) => {
                                            const [y, m, d] = e.currentTarget.value.split('-').map((n) => parseInt(n,10));
                                            if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
                                                const nd = new Date(current);
                                                nd.setFullYear(y, m - 1, d);
                                                field.onChange(nd);
                                            }
                                        }}
                                        error={errors.fecha_evento?.message}
                                    />
                                    <TimeInput
                                        label="Hora"
                                        value={`${hours}:${minutes}`}
                                        onChange={(e) => applyTime(e.currentTarget.value)}
                                    />
                                </Group>
                            );
                        }}
                    />
                    <Textarea
                        label="Observaciones"
                        placeholder="Ingrese un comentario sobre el cambio de estado"
                        {...register('observaciones')}
                        error={errors.observaciones?.message}
                        minRows={3}
                        mb="md"
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={close}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting}>Actualizar</Button>
                    </Group>
                </form>
            </Modal>
        </>
    );
}
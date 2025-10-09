// frontend/src/features/casos/components/CasoForm.tsx
import { useForm } from '@mantine/form';
import { TextInput, Button, Textarea, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { TipoCasoSelect } from '../../tipos-caso/components/TipoCasoSelect';
import { crearCaso, actualizarCaso } from '../services/casoService';
import type { Caso, CrearCasoPayload, EstadoCaso, PrioridadCaso } from '../types';

interface CasoFormProps {
    caso?: Caso;
    onSuccess?: () => void;
}

const ESTADOS: { value: EstadoCaso; label: string }[] = [
    { value: 'Abierto', label: 'Abierto' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Resuelto', label: 'Resuelto' },
    { value: 'Cerrado', label: 'Cerrado' },
];

const PRIORIDADES: { value: PrioridadCaso; label: string }[] = [
    { value: 'Baja', label: 'Baja' },
    { value: 'Media', label: 'Media' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Urgente', label: 'Urgente' },
];

export function CasoForm({ caso, onSuccess }: CasoFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!caso;

    const form = useForm({
        initialValues: {
            titulo: caso?.titulo || '',
            descripcion: caso?.descripcion || '',
            estado: caso?.estado || 'Abierto',
            prioridad: caso?.prioridad || 'Media',
            id_cliente: caso?.id_cliente || 0,
            id_tipo_caso: caso?.id_tipo_caso || 1, // 1 = Instalación por defecto
        },
        validate: {
            titulo: (value) => (value.trim().length < 3 ? 'El título debe tener al menos 3 caracteres' : null),
            descripcion: (value) => (value.trim().length < 10 ? 'La descripción debe tener al menos 10 caracteres' : null),
            id_cliente: (value) => (value === 0 ? 'Debe seleccionar un cliente' : null),
            id_tipo_caso: (value) => (value === 0 ? 'Debe seleccionar un tipo de caso' : null),
        },
    });

    const mutation = useMutation({
        mutationFn: (values: typeof form.values) => {
            if (isEditing) {
                return actualizarCaso(caso.id_caso, {
                    titulo: values.titulo,
                    descripcion: values.descripcion,
                    estado: values.estado as EstadoCaso,
                    prioridad: values.prioridad as PrioridadCaso,
                });
            } else {
                const payload: CrearCasoPayload = {
                    titulo: values.titulo,
                    descripcion: values.descripcion,
                    estado: values.estado as EstadoCaso,
                    prioridad: values.prioridad as PrioridadCaso,
                    id_cliente: values.id_cliente,
                    id_tipo_caso: values.id_tipo_caso,
                };
                return crearCaso(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['casos'] });
            notifications.show({
                title: isEditing ? 'Caso Actualizado' : 'Caso Creado',
                message: `El caso ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`,
                color: 'green',
            });
            form.reset();
            onSuccess?.();
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || error.message || 'Hubo un error al procesar el caso',
                color: 'red',
            });
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        mutation.mutate(values);
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                <TextInput
                    label="Título del Caso"
                    placeholder="Ej: Solicitud de instalación para nuevo cliente"
                    withAsterisk
                    {...form.getInputProps('titulo')}
                />

                <Textarea
                    label="Descripción"
                    placeholder="Describa detalladamente el caso..."
                    withAsterisk
                    minRows={4}
                    {...form.getInputProps('descripcion')}
                />

                {!isEditing && (
                    <>
                        <ClienteSelect
                            label="Cliente"
                            withAsterisk
                            value={form.values.id_cliente.toString()}
                            onChange={(value) => form.setFieldValue('id_cliente', Number(value))}
                            error={form.errors.id_cliente as string | undefined}
                        />

                        <TipoCasoSelect
                            label="Tipo de Caso"
                            withAsterisk
                            value={form.values.id_tipo_caso.toString()}
                            onChange={(value) => form.setFieldValue('id_tipo_caso', Number(value))}
                            error={form.errors.id_tipo_caso as string | undefined}
                        />
                    </>
                )}

                <Select
                    label="Estado"
                    withAsterisk
                    data={ESTADOS}
                    {...form.getInputProps('estado')}
                />

                <Select
                    label="Prioridad"
                    withAsterisk
                    data={PRIORIDADES}
                    {...form.getInputProps('prioridad')}
                />

                <Button type="submit" fullWidth loading={mutation.isPending}>
                    {isEditing ? 'Actualizar Caso' : 'Crear Caso'}
                </Button>
            </Stack>
        </form>
    );
}


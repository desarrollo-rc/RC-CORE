// frontend/src/features/equipos/components/EquipoForm.tsx
import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { TextInput, Button, Select, Stack, NumberInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { crearEquipo, actualizarEquipo } from '../services/equipoService';
import { getUsuariosB2B } from '../../usuarios-b2b/services/usuarioB2BService';
import type { Equipo, CrearEquipoPayload, EstadoAltaEquipo } from '../types';
import type { UsuarioB2B } from '../../usuarios-b2b/types';

interface EquipoFormProps {
    equipo?: Equipo;
    onSuccess?: () => void;
}

const ESTADOS: { value: EstadoAltaEquipo; label: string }[] = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
];

// Función para normalizar el estado alta que viene del backend
const normalizarEstadoAlta = (estado: any): EstadoAltaEquipo => {
    if (!estado) return 'PENDIENTE';
    
    const estadoStr = String(estado).toUpperCase();
    if (estadoStr.includes('APROBADO')) return 'APROBADO';
    if (estadoStr.includes('RECHAZADO')) return 'RECHAZADO';
    if (estadoStr.includes('PENDIENTE')) return 'PENDIENTE';
    
    return 'PENDIENTE'; // Valor por defecto
};

export function EquipoForm({ equipo, onSuccess }: EquipoFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!equipo;

    // Obtener usuarios B2B para el select
    const { data: usuariosB2B = [] } = useQuery<UsuarioB2B[]>({
        queryKey: ['usuarios-b2b'],
        queryFn: getUsuariosB2B,
        enabled: !isEditing, // Solo cargar cuando no estamos editando
    });

    // Debug: ver qué valor está llegando
    console.log('Equipo recibido:', equipo);
    console.log('Estado alta recibido:', equipo?.estado_alta);

    const form = useForm({
        initialValues: {
            id_usuario_b2b: equipo?.id_usuario_b2b || 0,
            nombre_equipo: equipo?.nombre_equipo || '',
            mac_address: equipo?.mac_address || '',
            procesador: equipo?.procesador || '',
            placa_madre: equipo?.placa_madre || '',
            disco_duro: equipo?.disco_duro || '',
            estado_alta: normalizarEstadoAlta(equipo?.estado_alta),
        },
        validate: {
            id_usuario_b2b: (value) => (value === 0 ? 'Debe ingresar un ID de usuario B2B' : null),
            nombre_equipo: (value) => (value.trim().length < 2 ? 'El nombre es muy corto' : null),
            mac_address: (value) => (value.trim().length < 2 ? 'Dirección MAC requerida' : null),
            procesador: (value) => (value.trim().length < 2 ? 'Procesador requerido' : null),
            placa_madre: (value) => (value.trim().length < 2 ? 'Placa madre requerida' : null),
            disco_duro: (value) => (value.trim().length < 2 ? 'Disco duro requerido' : null),
        },
    });

    // Actualizar el formulario cuando cambie el equipo
    useEffect(() => {
        if (equipo) {
            form.setValues({
                id_usuario_b2b: equipo.id_usuario_b2b || 0,
                nombre_equipo: equipo.nombre_equipo || '',
                mac_address: equipo.mac_address || '',
                procesador: equipo.procesador || '',
                placa_madre: equipo.placa_madre || '',
                disco_duro: equipo.disco_duro || '',
                estado_alta: normalizarEstadoAlta(equipo.estado_alta),
            });
        }
    }, [equipo]);

    const mutation = useMutation({
        mutationFn: (values: typeof form.values) => {
            if (isEditing) {
                return actualizarEquipo(equipo.id_equipo, {
                    nombre_equipo: values.nombre_equipo,
                    mac_address: values.mac_address,
                    procesador: values.procesador,
                    placa_madre: values.placa_madre,
                    disco_duro: values.disco_duro,
                    estado_alta: values.estado_alta as EstadoAltaEquipo,
                });
            } else {
                const payload: CrearEquipoPayload = {
                    id_usuario_b2b: values.id_usuario_b2b,
                    nombre_equipo: values.nombre_equipo,
                    mac_address: values.mac_address,
                    procesador: values.procesador,
                    placa_madre: values.placa_madre,
                    disco_duro: values.disco_duro,
                    estado_alta: values.estado_alta as EstadoAltaEquipo,
                };
                return crearEquipo(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
            notifications.show({
                title: isEditing ? 'Equipo Actualizado' : 'Equipo Creado',
                message: `El equipo ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`,
                color: 'green',
            });
            form.reset();
            onSuccess?.();
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || error.message || 'Hubo un error al procesar el equipo',
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
                {!isEditing && (
                    <Select
                        label="Usuario B2B"
                        placeholder="Seleccione un usuario B2B"
                        withAsterisk
                        description="Seleccione el usuario B2B para este equipo"
                        data={usuariosB2B.map(usuario => ({
                            value: usuario.id_usuario_b2b.toString(),
                            label: `${usuario.usuario} - ${usuario.nombre_completo}`
                        }))}
                        searchable
                        nothingFoundMessage="No se encontraron usuarios B2B"
                        {...form.getInputProps('id_usuario_b2b')}
                    />
                )}

                <TextInput
                    label="Nombre del Equipo"
                    placeholder="Ej: PC Principal"
                    withAsterisk
                    {...form.getInputProps('nombre_equipo')}
                />

                <TextInput
                    label="Dirección MAC"
                    placeholder="Ej: 00:1B:63:84:45:E6"
                    withAsterisk
                    description="Dirección MAC del dispositivo"
                    {...form.getInputProps('mac_address')}
                />

                <TextInput
                    label="Procesador"
                    placeholder="Ej: Intel Core i7-9700K"
                    withAsterisk
                    {...form.getInputProps('procesador')}
                />

                <TextInput
                    label="Placa Madre"
                    placeholder="Ej: ASUS ROG STRIX Z390-E"
                    withAsterisk
                    {...form.getInputProps('placa_madre')}
                />

                <TextInput
                    label="Disco Duro"
                    placeholder="Ej: Samsung 970 EVO 500GB"
                    withAsterisk
                    {...form.getInputProps('disco_duro')}
                />

                <Select
                    label="Estado de Alta"
                    withAsterisk
                    data={ESTADOS}
                    {...form.getInputProps('estado_alta')}
                />

                <Button type="submit" fullWidth loading={mutation.isPending}>
                    {isEditing ? 'Actualizar Equipo' : 'Crear Equipo'}
                </Button>
            </Stack>
        </form>
    );
}


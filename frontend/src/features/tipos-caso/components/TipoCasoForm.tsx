// frontend/src/features/tipos-caso/components/TipoCasoForm.tsx
import { useForm } from '@mantine/form';
import { TextInput, Button, Textarea, Stack, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearTipoCaso, actualizarTipoCaso } from '../services/tipoCasoService';
import type { TipoCaso, CrearTipoCasoPayload, CategoriaTipoCaso } from '../types';

// Helper para extraer el valor del enum del formato backend
const extractEnumValue = (value: string | null): CategoriaTipoCaso | null => {
    if (!value) return null;
    
    // Si viene con el prefijo de la clase, extraer solo el valor
    if (value.includes('CategoriaTipoCaso.')) {
        return value.replace('CategoriaTipoCaso.', '') as CategoriaTipoCaso;
    }
    
    return value as CategoriaTipoCaso;
};

const CATEGORIAS: { value: CategoriaTipoCaso; label: string; description: string }[] = [
    { 
        value: 'INSTALACION_CLIENTE_NUEVO', 
        label: '🆕 Instalación Cliente Nuevo',
        description: 'Cliente que nunca ha tenido B2B y se le creará 1 o más usuarios'
    },
    { 
        value: 'INSTALACION_USUARIO_ADICIONAL', 
        label: '👤 Usuario Adicional',
        description: 'Nuevo usuario para un cliente que ya tiene B2B configurado'
    },
    { 
        value: 'INSTALACION_CAMBIO_EQUIPO', 
        label: '🔄 Cambio de Equipo',
        description: 'Usuario existente cambia de equipo, instalación de impresora, cambio de MAC, etc.'
    },
    { 
        value: 'SOPORTE_TECNICO', 
        label: '🔧 Soporte Técnico',
        description: 'Asistencia técnica para problemas del sistema B2B'
    },
    { 
        value: 'CONSULTA', 
        label: '💬 Consulta',
        description: 'Preguntas sobre funcionalidades o procesos'
    },
    { 
        value: 'BLOQUEO', 
        label: '🔒 Bloqueo',
        description: 'Desbloqueo de usuario o cuenta'
    },
    { 
        value: 'OTRO', 
        label: '📋 Otro',
        description: 'Caso que no se ajusta a las categorías anteriores'
    },
];

interface TipoCasoFormProps {
    tipoCaso?: TipoCaso;
    onSuccess?: () => void;
}

export function TipoCasoForm({ tipoCaso, onSuccess }: TipoCasoFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!tipoCaso;


    const form = useForm({
        initialValues: {
            codigo_tipo_caso: tipoCaso?.codigo_tipo_caso || '',
            nombre_tipo_caso: tipoCaso?.nombre_tipo_caso || '',
            descripcion_tipo_caso: tipoCaso?.descripcion_tipo_caso || '',
            categoria_uso: extractEnumValue(tipoCaso?.categoria_uso as string || null),
        },
        validate: {
            codigo_tipo_caso: (value) => {
                if (value.trim().length < 2) return 'El código debe tener al menos 2 caracteres';
                if (!/^[A-Z_]+$/.test(value.toUpperCase())) return 'Solo letras mayúsculas y guiones bajos';
                return null;
            },
            nombre_tipo_caso: (value) => (value.trim().length < 3 ? 'El nombre debe tener al menos 3 caracteres' : null),
        },
    });

    const mutation = useMutation({
        mutationFn: (values: typeof form.values) => {
            if (isEditing) {
                return actualizarTipoCaso(tipoCaso.id_tipo_caso, {
                    codigo_tipo_caso: values.codigo_tipo_caso.toUpperCase(),
                    nombre_tipo_caso: values.nombre_tipo_caso,
                    descripcion_tipo_caso: values.descripcion_tipo_caso || undefined,
                    categoria_uso: (values.categoria_uso as CategoriaTipoCaso) || undefined,
                });
            } else {
                const payload: CrearTipoCasoPayload = {
                    codigo_tipo_caso: values.codigo_tipo_caso.toUpperCase(),
                    nombre_tipo_caso: values.nombre_tipo_caso,
                    descripcion_tipo_caso: values.descripcion_tipo_caso || undefined,
                    categoria_uso: (values.categoria_uso as CategoriaTipoCaso) || undefined,
                };
                return crearTipoCaso(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tipos-caso'] });
            notifications.show({
                title: isEditing ? 'Tipo de Caso Actualizado' : 'Tipo de Caso Creado',
                message: `El tipo de caso ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`,
                color: 'green',
            });
            form.reset();
            onSuccess?.();
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || error.message || 'Hubo un error al procesar el tipo de caso',
                color: 'red',
            });
        },
    });

    return (
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
            <Stack gap="md">
                <TextInput
                    label="Código"
                    placeholder="Ej: INST_CLIENTE_NUEVO"
                    withAsterisk
                    description="Solo letras mayúsculas y guiones bajos"
                    disabled={isEditing}
                    {...form.getInputProps('codigo_tipo_caso')}
                />

                <TextInput
                    label="Nombre del Tipo"
                    placeholder="Ej: Instalación Cliente Nuevo"
                    withAsterisk
                    {...form.getInputProps('nombre_tipo_caso')}
                />

                <Textarea
                    label="Descripción"
                    placeholder="Describa el propósito de este tipo de caso..."
                    minRows={3}
                    {...form.getInputProps('descripcion_tipo_caso')}
                />

                <Select
                    label="Categoría de Uso"
                    placeholder="Seleccione una categoría (opcional)"
                    description="Para instalaciones, seleccione la categoría correspondiente para creación automática"
                    data={CATEGORIAS.map(cat => ({
                        value: cat.value,
                        label: cat.label,
                        description: cat.description
                    }))}
                    clearable
                    searchable
                    value={form.values.categoria_uso}
                    onChange={(value) => form.setFieldValue('categoria_uso', value as CategoriaTipoCaso | null)}
                    error={form.errors.categoria_uso}
                />

                <Button type="submit" fullWidth loading={mutation.isPending}>
                    {isEditing ? 'Actualizar Tipo de Caso' : 'Crear Tipo de Caso'}
                </Button>
            </Stack>
        </form>
    );
}


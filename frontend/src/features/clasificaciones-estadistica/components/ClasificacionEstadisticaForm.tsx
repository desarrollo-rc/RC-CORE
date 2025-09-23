// frontend/src/features/clasificaciones-estadistica/components/ClasificacionEstadisticaForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { ClasificacionEstadisticaFormData } from '../types';

interface ClasificacionEstadisticaFormProps {
    onSubmit: (values: ClasificacionEstadisticaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<ClasificacionEstadisticaFormData> | null;
}

export function ClasificacionEstadisticaForm({ onSubmit, isSubmitting, initialValues }: ClasificacionEstadisticaFormProps) {
    const form = useForm<ClasificacionEstadisticaFormData>({
        initialValues: {
            codigo: '',
            nombre: '',
        },
        validate: {
            codigo: isNotEmpty('El código es requerido'),
            nombre: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo: initialValues.codigo || '',
                nombre: initialValues.nombre || '',
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput
                    withAsterisk
                    label="Código"
                    placeholder="Ej: A-ALTA-ROT"
                    {...form.getInputProps('codigo')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Clasificación"
                    placeholder="Ej: Clase A - Alta Rotación"
                    {...form.getInputProps('nombre')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Clasificación
                </Button>
            </Stack>
        </form>
    );
}
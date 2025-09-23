// frontend/src/features/clasificaciones-servicio/components/ClasificacionServicioForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { ClasificacionServicioFormData } from '../types';

interface ClasificacionServicioFormProps {
    onSubmit: (values: ClasificacionServicioFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<ClasificacionServicioFormData> | null;
}

export function ClasificacionServicioForm({ onSubmit, isSubmitting, initialValues }: ClasificacionServicioFormProps) {
    const form = useForm<ClasificacionServicioFormData>({
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
                    placeholder="Ej: FRE"
                    {...form.getInputProps('codigo')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Clasificación"
                    placeholder="Ej: Frenos"
                    {...form.getInputProps('nombre')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Clasificación
                </Button>
            </Stack>
        </form>
    );
}
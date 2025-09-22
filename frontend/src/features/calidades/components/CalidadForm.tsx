// frontend/src/features/calidades/components/CalidadForm.tsx
import { TextInput, Button, Stack, Textarea } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { CalidadFormData } from '../types';

interface CalidadFormProps {
    onSubmit: (values: CalidadFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<CalidadFormData> | null;
}

export function CalidadForm({ onSubmit, isSubmitting, initialValues }: CalidadFormProps) {
    const form = useForm<CalidadFormData>({
        initialValues: {
            codigo_calidad: '',
            nombre_calidad: '',
            descripcion: '',
        },
        validate: {
            codigo_calidad: isNotEmpty('El código es requerido'),
            nombre_calidad: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues(initialValues);
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput
                    withAsterisk
                    label="Código de Calidad"
                    placeholder="Ej: ORI"
                    {...form.getInputProps('codigo_calidad')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Calidad"
                    placeholder="Ej: Original"
                    {...form.getInputProps('nombre_calidad')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción de la calidad"
                    rows={3}
                    {...form.getInputProps('descripcion')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Calidad
                </Button>
            </Stack>
        </form>
    );
}
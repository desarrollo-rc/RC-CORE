// src/features/productos/medidas/components/MedidaForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { MedidaFormData } from '../types';
import { useEffect } from 'react';

interface MedidaFormProps {
    onSubmit: (values: MedidaFormData) => void;
    initialValues?: Partial<MedidaFormData> | null;
    isSubmitting: boolean;
}

export function MedidaForm({ onSubmit, initialValues, isSubmitting }: MedidaFormProps) {
    const form = useForm<MedidaFormData>({
        initialValues: {
            nombre: initialValues?.nombre || '',
            unidad: initialValues?.unidad || '',
        },
        validate: {
            nombre: isNotEmpty('El nombre es requerido'),
            unidad: isNotEmpty('La unidad es requerida'),
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
                    label="Nombre de la Medida"
                    placeholder="Ej: Alto"
                    {...form.getInputProps('nombre')}
                />
                <TextInput
                    withAsterisk
                    label="Unidad"
                    placeholder="Ej: cm, mm, kg"
                    {...form.getInputProps('unidad')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Medida
                </Button>
            </Stack>
        </form>
    );
}
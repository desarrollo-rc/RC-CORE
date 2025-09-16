// src/features/productos/medidas/components/MedidaForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty, hasLength } from '@mantine/form';
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
            codigo: initialValues?.codigo || '',
            nombre: initialValues?.nombre || '',
            unidad: initialValues?.unidad || '',
        },
        validate: {
            codigo: (value) => {
                if (!value) return 'El código es requerido';
                if (value.length < 2 || value.length > 10) return 'El código debe tener entre 2 y 10 caracteres';
                return null;
            },
            nombre: hasLength({ min: 2, max: 100 }, 'El nombre debe tener entre 2 y 100 caracteres'),
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
                    label="Código"
                    placeholder="Ej: Alto"
                    {...form.getInputProps('codigo')}
                />
                <TextInput
                    withAsterisk
                    label="Medida"
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
// src/features/productos/atributos/components/AtributoForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, hasLength } from '@mantine/form';
import type { AtributoFormData } from '../types';
import { useEffect } from 'react';

interface AtributoFormProps {
    onSubmit: (values: AtributoFormData) => void;
    initialValues?: Partial<AtributoFormData> | null;
    isSubmitting: boolean;
}

export function AtributoForm({ onSubmit, initialValues, isSubmitting }: AtributoFormProps) {
    const form = useForm<AtributoFormData>({
        initialValues: {
            codigo: initialValues?.codigo || '',
            nombre: initialValues?.nombre || '',
        },
        validate: {
            codigo: hasLength({ min: 2, max: 10 }, 'El código debe tener entre 2 y 10 caracteres'),
            nombre: hasLength({ min: 3, max: 100 }, 'El nombre debe tener entre 3 y 100 caracteres'),
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
                    placeholder="Ej: LAD"
                    {...form.getInputProps('codigo')}
                />
                <TextInput
                    withAsterisk
                    label="Atributo"
                    placeholder="Ej: Lado"
                    {...form.getInputProps('nombre')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Atributo
                </Button>
            </Stack>
        </form>
    );
}
// src/features/productos/atributos/components/AtributoForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
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
            nombre: initialValues?.nombre || '',
        },
        validate: {
            nombre: isNotEmpty('El nombre es requerido'),
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
                    label="Nombre del Atributo"
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
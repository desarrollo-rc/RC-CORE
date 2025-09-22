// frontend/src/features/paises/components/PaisForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { PaisFormData } from '../types';

interface PaisFormProps {
    onSubmit: (values: PaisFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<PaisFormData> | null;
}

export function PaisForm({ onSubmit, isSubmitting, initialValues }: PaisFormProps) {
    const form = useForm<PaisFormData>({
        initialValues: {
            nombre_pais: '',
        },
        validate: {
            nombre_pais: isNotEmpty('El nombre del país es requerido'),
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
                    label="Nombre del País"
                    placeholder="Ej: Chile"
                    {...form.getInputProps('nombre_pais')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar País
                </Button>
            </Stack>
        </form>
    );
}
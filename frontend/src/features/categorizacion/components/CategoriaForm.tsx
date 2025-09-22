// src/features/categorizacion/components/CategoriaForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { CategoriaFormData } from '../types';
import { useEffect } from 'react';

interface CategoriaFormProps {
    onSubmit: (values: CategoriaFormData) => void;
    isSubmitting: boolean;
    initialValues?: { codigo: string; nombre: string } | null;
}

export function CategoriaForm({ onSubmit, isSubmitting, initialValues }: CategoriaFormProps) {
    const form = useForm<CategoriaFormData>({
        initialValues: { codigo_categoria: '', nombre_categoria: '' },
        validate: {
            codigo_categoria: isNotEmpty('El código es requerido'),
            nombre_categoria: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo_categoria: initialValues.codigo,
                nombre_categoria: initialValues.nombre,
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código de Categoría" {...form.getInputProps('codigo_categoria')} />
                <TextInput withAsterisk label="Nombre de Categoría" {...form.getInputProps('nombre_categoria')} />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar</Button>
            </Stack>
        </form>
    );
}
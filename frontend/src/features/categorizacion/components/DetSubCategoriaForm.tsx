import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { DetSubCategoriaFormData } from '../types';
import { useEffect } from 'react';

interface DetSubCategoriaFormProps {
    onSubmit: (values: DetSubCategoriaFormData) => void;
    isSubmitting: boolean;
    initialValues?: { codigo: string; nombre: string } | null;
}

export function DetSubCategoriaForm({ onSubmit, isSubmitting, initialValues }: DetSubCategoriaFormProps) {
    const form = useForm<DetSubCategoriaFormData>({
        initialValues: { codigo_det_sub_categoria: '', nombre_det_sub_categoria: '' },
        validate: {
            codigo_det_sub_categoria: isNotEmpty('El código es requerido'),
            nombre_det_sub_categoria: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo_det_sub_categoria: initialValues.codigo,
                nombre_det_sub_categoria: initialValues.nombre,
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código del Detalle" {...form.getInputProps('codigo_det_sub_categoria')} />
                <TextInput withAsterisk label="Nombre del Detalle" {...form.getInputProps('nombre_det_sub_categoria')} />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar</Button>
            </Stack>
        </form>
    );
}
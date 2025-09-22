import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { SubCategoriaFormData } from '../types';
import { useEffect } from 'react';

interface SubCategoriaFormProps {
    onSubmit: (values: SubCategoriaFormData) => void;
    isSubmitting: boolean;
    initialValues?: { codigo: string; nombre: string } | null;
}

export function SubCategoriaForm({ onSubmit, isSubmitting, initialValues }: SubCategoriaFormProps) {
    const form = useForm<SubCategoriaFormData>({
        initialValues: { codigo_sub_categoria: '', nombre_sub_categoria: '' },
        validate: {
            codigo_sub_categoria: isNotEmpty('El código es requerido'),
            nombre_sub_categoria: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo_sub_categoria: initialValues.codigo,
                nombre_sub_categoria: initialValues.nombre,
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código de Subcategoría" {...form.getInputProps('codigo_sub_categoria')} />
                <TextInput withAsterisk label="Nombre de Subcategoría" {...form.getInputProps('nombre_sub_categoria')} />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar</Button>
            </Stack>
        </form>
    );
}
// src/features/productos/divisiones/components/DivisionForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { DivisionFormData } from '../types';
import { useEffect } from 'react';

interface DivisionFormProps {
    onSubmit: (values: DivisionFormData) => void;
    isSubmitting: boolean;
    initialValues?: { codigo: string; nombre: string } | null;
}

export function DivisionForm({ onSubmit, initialValues, isSubmitting }: DivisionFormProps) {
    const form = useForm<DivisionFormData>({
        initialValues: { codigo_division: '', nombre_division: '' },
        validate: {
            codigo_division: isNotEmpty('El código es requerido'),
            nombre_division: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo_division: initialValues.codigo,
                nombre_division: initialValues.nombre,
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
                    label="Código de División"
                    placeholder="Ej: REP"
                    {...form.getInputProps('codigo_division')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la División"
                    placeholder="Ej: Repuestos"
                    {...form.getInputProps('nombre_division')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar División
                </Button>
            </Stack>
        </form>
    );
}
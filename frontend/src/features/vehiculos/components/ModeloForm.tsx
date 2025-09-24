// frontend/src/features/vehiculos/components/ModeloForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { ModeloFormData } from '../types';

interface ModeloFormProps {
    onSubmit: (values: ModeloFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<ModeloFormData> | null;
}

export function ModeloForm({ onSubmit, isSubmitting, initialValues }: ModeloFormProps) {
    const form = useForm<ModeloFormData>({
        initialValues: { codigo_modelo: '', nombre_modelo: '' },
        validate: {
            codigo_modelo: isNotEmpty('El código es requerido'),
            nombre_modelo: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        form.setValues({
            codigo_modelo: initialValues?.codigo_modelo || '',
            nombre_modelo: initialValues?.nombre_modelo || '',
        });
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código del Modelo" placeholder="Ej: YAR" {...form.getInputProps('codigo_modelo')} />
                <TextInput withAsterisk label="Nombre del Modelo" placeholder="Ej: Yaris" {...form.getInputProps('nombre_modelo')} />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar Modelo</Button>
            </Stack>
        </form>
    );
}
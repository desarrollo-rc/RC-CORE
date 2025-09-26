// frontend/src/features/tipos-cliente/components/TipoClienteForm.tsx
import { TextInput, Button, Stack, Textarea } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { TipoClienteFormData } from '../types';

interface TipoClienteFormProps {
    onSubmit: (values: TipoClienteFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<TipoClienteFormData> | null;
}

export function TipoClienteForm({ onSubmit, isSubmitting, initialValues }: TipoClienteFormProps) {
    const form = useForm<TipoClienteFormData>({
        initialValues: {
            codigo_tipo_cliente: '',
            nombre_tipo_cliente: '',
            descripcion_tipo_cliente: '',
        },
        validate: {
            codigo_tipo_cliente: isNotEmpty('El código es requerido'),
            nombre_tipo_cliente: isNotEmpty('El nombre es requerido'),
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
                    placeholder="Ej: NAC"
                    {...form.getInputProps('codigo_tipo_cliente')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre del Tipo de Cliente"
                    placeholder="Ej: Cliente Nacional"
                    {...form.getInputProps('nombre_tipo_cliente')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción del tipo de cliente"
                    rows={3}
                    {...form.getInputProps('descripcion_tipo_cliente')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
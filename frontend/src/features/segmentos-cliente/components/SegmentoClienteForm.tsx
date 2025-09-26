// frontend/src/features/segmentos-cliente/components/SegmentoClienteForm.tsx
import { TextInput, Button, Stack, Textarea } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { SegmentoClienteFormData } from '../types';

interface SegmentoClienteFormProps {
    onSubmit: (values: SegmentoClienteFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<SegmentoClienteFormData> | null;
}

export function SegmentoClienteForm({ onSubmit, isSubmitting, initialValues }: SegmentoClienteFormProps) {
    const form = useForm<SegmentoClienteFormData>({
        initialValues: {
            codigo_segmento_cliente: '',
            nombre_segmento_cliente: '',
            descripcion_segmento_cliente: '',
        },
        validate: {
            codigo_segmento_cliente: isNotEmpty('El código es requerido'),
            nombre_segmento_cliente: isNotEmpty('El nombre es requerido'),
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
                    placeholder="Ej: XL_VOL"
                    {...form.getInputProps('codigo_segmento_cliente')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre del Segmento"
                    placeholder="Ej: XL Volumen"
                    {...form.getInputProps('nombre_segmento_cliente')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción del segmento"
                    rows={3}
                    {...form.getInputProps('descripcion_segmento_cliente')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
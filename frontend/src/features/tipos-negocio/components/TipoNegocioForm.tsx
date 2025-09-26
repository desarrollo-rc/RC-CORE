// frontend/src/features/tipos-negocio/components/TipoNegocioForm.tsx
import { TextInput, Button, Stack, Textarea } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { TipoNegocioFormData } from '../types';

interface TipoNegocioFormProps {
    onSubmit: (values: TipoNegocioFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<TipoNegocioFormData> | null;
}

export function TipoNegocioForm({ onSubmit, isSubmitting, initialValues }: TipoNegocioFormProps) {
    const form = useForm<TipoNegocioFormData>({
        initialValues: {
            codigo_tipo_negocio: '',
            nombre_tipo_negocio: '',
            descripcion_tipo_negocio: '',
        },
        validate: {
            codigo_tipo_negocio: isNotEmpty('El código es requerido'),
            nombre_tipo_negocio: isNotEmpty('El nombre es requerido'),
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
                    placeholder="Ej: DIST"
                    {...form.getInputProps('codigo_tipo_negocio')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre del Tipo de Negocio"
                    placeholder="Ej: Distribuidor"
                    {...form.getInputProps('nombre_tipo_negocio')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción del tipo de negocio"
                    rows={3}
                    {...form.getInputProps('descripcion_tipo_negocio')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
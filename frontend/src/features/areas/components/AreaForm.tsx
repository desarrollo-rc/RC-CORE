// src/features/areas/components/AreaForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { AreaPayload } from '../types';
import { useEffect } from 'react';

type AreaFormData = Omit<AreaPayload, 'fecha_creacion' | 'fecha_modificacion'>;

interface AreaFormProps {
    onSubmit: (values: AreaFormData) => void;
    initialValues?: Partial<AreaPayload> | null;
    isSubmitting: boolean;
}

export function AreaForm({ onSubmit, initialValues, isSubmitting }: AreaFormProps) {
    const form = useForm({
        initialValues: {
            codigo_area: initialValues?.codigo_area || '',
            nombre_area: initialValues?.nombre_area || '',
            descripcion_area: initialValues?.descripcion_area || '',
        },
        validate: {
            codigo_area: isNotEmpty('El código es requerido'),
            nombre_area: isNotEmpty('El nombre es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo_area: initialValues.codigo_area || '',
                nombre_area: initialValues.nombre_area || '',
                descripcion_area: initialValues.descripcion_area || '',
            });
        } else {
            form.reset(); // Limpia el formulario si no hay valores (modo creación)
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput
                    withAsterisk
                    label="Código de Área"
                    placeholder="Ej: FIN"
                    {...form.getInputProps('codigo_area')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre del Área"
                    placeholder="Ej: Finanzas"
                    {...form.getInputProps('nombre_area')}
                />
                <TextInput
                    label="Descripción"
                    placeholder="Ej: Departamento de contabilidad y tesorería"
                    {...form.getInputProps('descripcion_area')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
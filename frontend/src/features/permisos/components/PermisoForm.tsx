// src/features/permisos/components/PermisoForm.tsx

import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { PermisoPayload } from '../types';
import { useEffect } from 'react';

interface PermisoFormProps {
    onSubmit: (values: PermisoPayload) => void;
    initialValues?: Partial<PermisoPayload> | null;
    isSubmitting: boolean;
}

export function PermisoForm({ onSubmit, initialValues, isSubmitting }: PermisoFormProps) {
    const form = useForm({
        initialValues: {
            nombre_permiso: initialValues?.nombre_permiso || '',
            descripcion_permiso: initialValues?.descripcion_permiso || '',
        },
        validate: {
            nombre_permiso: isNotEmpty('El nombre del permiso es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                nombre_permiso: initialValues.nombre_permiso || '',
                descripcion_permiso: initialValues.descripcion_permiso || '',
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
                    label="Nombre del Permiso (Clave)"
                    placeholder="ej: usuarios:crear"
                    {...form.getInputProps('nombre_permiso')}
                />
                <TextInput
                    label="Descripción"
                    placeholder="ej: Permite la creación de nuevos usuarios"
                    {...form.getInputProps('descripcion_permiso')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Permiso
                </Button>
            </Stack>
        </form>
    );
}
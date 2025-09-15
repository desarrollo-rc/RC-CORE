// src/features/roles/components/RolForm.tsx

import { TextInput, Button, Stack, MultiSelect } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { Permiso } from '../../permisos/types';
import type { RolFormData } from '../types';
import { useEffect } from 'react';

interface RolFormProps {
    onSubmit: (values: RolFormData) => void;
    initialValues?: Partial<RolFormData> | null;
    isSubmitting: boolean;
    availablePermisos: Permiso[];
}

export function RolForm({ onSubmit, initialValues, isSubmitting, availablePermisos }: RolFormProps) {
    const permisosData = availablePermisos.map(p => ({
        value: p.id_permiso.toString(),
        label: p.nombre_permiso,
    }));

    const form = useForm<RolFormData>({
        initialValues: {
            nombre_rol: initialValues?.nombre_rol || '',
            descripcion_rol: initialValues?.descripcion_rol || '',
            permisos_ids: initialValues?.permisos_ids?.map(id => id.toString()) || [],
        },
        validate: {
            nombre_rol: isNotEmpty('El nombre del rol es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                ...initialValues,
                permisos_ids: initialValues.permisos_ids || [],
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
                    label="Nombre del Rol"
                    placeholder="ej: Administrador"
                    {...form.getInputProps('nombre_rol')}
                />
                <TextInput
                    label="Descripción"
                    placeholder="ej: Acceso total al sistema"
                    {...form.getInputProps('descripcion_rol')}
                />
                <MultiSelect
                    label="Permisos Asignados"
                    placeholder="Selecciona uno o más permisos"
                    data={permisosData}
                    searchable
                    clearable
                    {...form.getInputProps('permisos_ids')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Rol
                </Button>
            </Stack>
        </form>
    );
}
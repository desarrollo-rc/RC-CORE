// src/features/usuarios/components/UsuarioForm.tsx

import { TextInput, Button, Stack, MultiSelect, Select, PasswordInput } from '@mantine/core';
import { useForm, isNotEmpty, isEmail } from '@mantine/form';
import { useEffect } from 'react';
import type { Area } from '../../areas/types';
import type { Rol } from '../../roles/types';
import type { UsuarioFormData, Usuario } from '../types';

interface UsuarioFormProps {
    onSubmit: (values: UsuarioFormData) => void;
    initialValues?: Partial<UsuarioFormData> | null;
    isSubmitting: boolean;
    availableAreas: Area[];
    availableRoles: Rol[];
    availableUsuarios: Usuario[];
    editingUserId?: number | null;
}

export function UsuarioForm({ onSubmit, initialValues, isSubmitting, availableAreas, availableRoles, availableUsuarios, editingUserId }: UsuarioFormProps) {
    // Transformamos los datos para los selectores
    const areasData = availableAreas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }));
    const rolesData = availableRoles.map(r => ({ value: r.id_rol.toString(), label: r.nombre_rol }));
    // Excluimos al usuario actual de la lista de posibles jefes para evitar que sea su propio jefe
    const jefesData = availableUsuarios
        .filter(u => u.id_usuario !== editingUserId)
        .map(u => ({ value: u.id_usuario.toString(), label: u.nombre_completo }));

    const form = useForm<UsuarioFormData>({
        initialValues: {
            nombre_completo: initialValues?.nombre_completo || '',
            email: initialValues?.email || '',
            telefono: initialValues?.telefono || '',
            password: '', // La contraseña siempre empieza vacía
            id_area: initialValues?.id_area || null,
            roles_ids: initialValues?.roles_ids || [],
            id_jefe_directo: initialValues?.id_jefe_directo || null,
        },
        validate: {
            nombre_completo: isNotEmpty('El nombre es requerido'),
            email: isEmail('El email no es válido'),
            id_area: isNotEmpty('Debe seleccionar un área'),
            // La contraseña solo es requerida si estamos creando un nuevo usuario (initialValues es nulo)
            password: (value) => {
                // Si estamos creando (no hay initialValues) y no hay contraseña, es un error.
                if (!initialValues && (!value || value.length < 8)) {
                    return 'La contraseña es requerida y debe tener al menos 8 caracteres';
                }
                // Si estamos editando y se ha escrito algo en el campo, debe tener al menos 8 caracteres.
                if (initialValues && value && value.length < 8) {
                    return 'La nueva contraseña debe tener al menos 8 caracteres';
                }
                // Si está en blanco en modo edición, o si cumple la longitud, no hay error.
                return null;
            },
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
                <TextInput withAsterisk label="Nombre Completo" {...form.getInputProps('nombre_completo')} />
                <TextInput withAsterisk label="Email" type="email" {...form.getInputProps('email')} />
                <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
                <PasswordInput
                    label="Contraseña"
                    description={initialValues ? "Dejar en blanco para no cambiar la contraseña" : "La contraseña es requerida para nuevos usuarios"}
                    withAsterisk={!initialValues} // El asterisco solo aparece en modo creación
                    {...form.getInputProps('password')}
                />
                <Select
                    withAsterisk
                    label="Área"
                    placeholder="Seleccione un área"
                    data={areasData}
                    searchable
                    clearable
                    {...form.getInputProps('id_area')}
                />
                <MultiSelect
                    label="Roles"
                    placeholder="Seleccione uno o más roles"
                    data={rolesData}
                    searchable
                    clearable
                    {...form.getInputProps('roles_ids')}
                />
                <Select
                    label="Jefe Directo"
                    placeholder="Seleccione un jefe (opcional)"
                    data={jefesData}
                    searchable
                    clearable
                    {...form.getInputProps('id_jefe_directo')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Usuario
                </Button>
            </Stack>
        </form>
    );
}
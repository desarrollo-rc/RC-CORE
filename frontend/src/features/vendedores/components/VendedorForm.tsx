// frontend/src/features/vendedores/components/VendedorForm.tsx
import { Select, TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect, useMemo } from 'react';
import type { VendedorFormData, Vendedor } from '../types';
import type { Usuario } from '../../usuarios/types';

interface VendedorFormProps {
    onSubmit: (values: VendedorFormData) => void;
    isSubmitting: boolean;
    editingVendedor: Vendedor | null;
    availableUsers: Usuario[];
    allUsers: Usuario[];
}

export function VendedorForm({ onSubmit, isSubmitting, editingVendedor, availableUsers, allUsers }: VendedorFormProps) {
    const form = useForm<VendedorFormData>({
        initialValues: {
            id_usuario: null,
            codigo_vendedor_sap: '',
        },
        validate: {
            id_usuario: isNotEmpty('Debe seleccionar un usuario'),
        },
    });

    useEffect(() => {
        if (editingVendedor) {
            form.setValues({
                id_usuario: editingVendedor.usuario.id_usuario.toString(),
                codigo_vendedor_sap: editingVendedor.codigo_vendedor_sap || '',
            });
        } else {
            form.reset();
        }
    }, [editingVendedor]);

    const userOptions = useMemo(() => {
        if (editingVendedor) {
            // Si estamos editando, solo mostramos el usuario actual
            const currentUser = allUsers.find(u => u.id_usuario === editingVendedor.usuario.id_usuario);
            return currentUser ? [{ value: currentUser.id_usuario.toString(), label: `${currentUser.nombre_completo} (${currentUser.email})` }] : [];
        }
        // Si estamos creando, mostramos solo los disponibles
        return availableUsers.map(user => ({
            value: user.id_usuario.toString(),
            label: `${user.nombre_completo} (${user.email})`,
        }));
    }, [editingVendedor, availableUsers, allUsers]);


    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <Select
                    withAsterisk
                    label="Usuario a asignar como Vendedor"
                    placeholder="Seleccione un usuario de la lista"
                    data={userOptions}
                    searchable
                    disabled={!!editingVendedor} // El usuario no se puede cambiar al editar
                    {...form.getInputProps('id_usuario')}
                />
                <TextInput
                    label="Código de Vendedor SAP (Opcional)"
                    placeholder="Ej: 12345"
                    {...form.getInputProps('codigo_vendedor_sap')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
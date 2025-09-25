// frontend/src/features/proveedores/components/ProveedorForm.tsx
import { TextInput, Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { ProveedorFormData } from '../types';
import type { Pais } from '../../paises/types';

interface ProveedorFormProps {
    onSubmit: (values: ProveedorFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<ProveedorFormData> | null;
    paises: Pais[];
}

export function ProveedorForm({ onSubmit, isSubmitting, initialValues, paises }: ProveedorFormProps) {
    const form = useForm<ProveedorFormData>({
        initialValues: {
            codigo_proveedor: '',
            nombre_proveedor: '',
            rut_proveedor: '',
            id_pais: null,
            direccion: '',
            telefono: '',
            email: ''
        },
        validate: {
            codigo_proveedor: isNotEmpty('El código es requerido'),
            nombre_proveedor: isNotEmpty('El nombre es requerido'),
            rut_proveedor: isNotEmpty('El RUT es requerido'),
            id_pais: isNotEmpty('Debe seleccionar un país'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                ...initialValues,
                id_pais: initialValues.id_pais?.toString() ?? null
            });
        } else {
            form.reset();
        }
    }, [initialValues]);
    
    const paisesOptions = paises.map(p => ({ value: p.id_pais.toString(), label: p.nombre_pais }));

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código de Proveedor" {...form.getInputProps('codigo_proveedor')} />
                <TextInput withAsterisk label="Nombre del Proveedor" {...form.getInputProps('nombre_proveedor')} />
                <TextInput withAsterisk label="RUT del Proveedor" {...form.getInputProps('rut_proveedor')} />
                <Select withAsterisk label="País" data={paisesOptions} searchable {...form.getInputProps('id_pais')} />
                <TextInput label="Email" {...form.getInputProps('email')} />
                <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
                <TextInput label="Dirección" {...form.getInputProps('direccion')} />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar Proveedor</Button>
            </Stack>
        </form>
    );
}
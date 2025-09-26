// frontend/src/features/empresas/components/EmpresaForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { EmpresaFormData } from '../types';

interface EmpresaFormProps {
    onSubmit: (values: EmpresaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<EmpresaFormData> | null;
}

export function EmpresaForm({ onSubmit, isSubmitting, initialValues }: EmpresaFormProps) {
    const form = useForm<EmpresaFormData>({
        initialValues: {
            codigo_empresa: '',
            nombre_empresa: '',
            rut_empresa: '',
        },
        validate: {
            codigo_empresa: isNotEmpty('El código es requerido'),
            nombre_empresa: isNotEmpty('El nombre es requerido'),
            rut_empresa: isNotEmpty('El RUT es requerido'),
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
                    label="Código de Empresa"
                    placeholder="Ej: RC_CL"
                    {...form.getInputProps('codigo_empresa')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Empresa"
                    placeholder="Ej: Repuesto Center S.A."
                    {...form.getInputProps('nombre_empresa')}
                />
                <TextInput
                    withAsterisk
                    label="RUT de la Empresa"
                    placeholder="Ej: 76.123.456-7"
                    {...form.getInputProps('rut_empresa')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
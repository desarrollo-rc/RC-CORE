// frontend/src/features/fabricas/components/FabricaForm.tsx
import { TextInput, Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { FabricaFormData } from '../types';
import type { Pais } from '../../paises/types';

interface FabricaFormProps {
    onSubmit: (values: FabricaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<FabricaFormData> | null;
    paises: Pais[];
}

export function FabricaForm({ onSubmit, isSubmitting, initialValues, paises }: FabricaFormProps) {
    const paisesData = paises.map(pais => ({
        value: pais.id_pais.toString(),
        label: pais.nombre_pais,
    }));

    const form = useForm<FabricaFormData>({
        initialValues: {
            nombre_fabrica: '',
            id_pais: null,
        },
        validate: {
            nombre_fabrica: isNotEmpty('El nombre es requerido'),
            id_pais: isNotEmpty('Debe seleccionar un país'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                nombre_fabrica: initialValues.nombre_fabrica || '',
                id_pais: initialValues.id_pais?.toString() || null,
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
                    label="Nombre de la Fábrica"
                    placeholder="Ej: Brembo S.p.A."
                    {...form.getInputProps('nombre_fabrica')}
                />
                <Select
                    withAsterisk
                    label="País de Origen"
                    placeholder="Seleccione un país"
                    data={paisesData}
                    searchable
                    clearable
                    {...form.getInputProps('id_pais')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Fábrica
                </Button>
            </Stack>
        </form>
    );
}
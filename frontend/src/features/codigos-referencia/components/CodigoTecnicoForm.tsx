// frontend/src/features/codigos-referencia/components/CodigoTecnicoForm.tsx
import { TextInput, Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { CodigoTecnicoFormData } from '../types';
import { TipoCodigoTecnico } from '../types';

interface CodigoTecnicoFormProps {
    onSubmit: (values: CodigoTecnicoFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<CodigoTecnicoFormData> | null;
}

export function CodigoTecnicoForm({ onSubmit, isSubmitting, initialValues }: CodigoTecnicoFormProps) {
    const form = useForm<CodigoTecnicoFormData>({
        initialValues: {
            codigo: '',
            tipo: '',
        },
        validate: {
            codigo: isNotEmpty('El código es requerido'),
            tipo: isNotEmpty('Debe seleccionar un tipo'),
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
                    label="Código Técnico"
                    placeholder="Ej: 15601-BZ030"
                    {...form.getInputProps('codigo')}
                />
                <Select
                    withAsterisk
                    label="Tipo de Código"
                    placeholder="Seleccione un tipo"
                    data={Object.values(TipoCodigoTecnico)}
                    {...form.getInputProps('tipo')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Código Técnico
                </Button>
            </Stack>
        </form>
    );
}
// frontend/src/features/marcas/components/MarcaForm.tsx
import { TextInput, Button, Stack, Select, Textarea } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { MarcaFormData } from '../types';
import { AmbitoMarca } from '../types';

interface MarcaFormProps {
    onSubmit: (values: MarcaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<MarcaFormData> | null;
}

export function MarcaForm({ onSubmit, isSubmitting, initialValues }: MarcaFormProps) {
    const form = useForm<MarcaFormData>({
        initialValues: {
            codigo_marca: '',
            nombre_marca: '',
            ambito_marca: '',
            descripcion: '',
        },
        validate: {
            codigo_marca: isNotEmpty('El código es requerido'),
            nombre_marca: isNotEmpty('El nombre es requerido'),
            ambito_marca: isNotEmpty('Debe seleccionar un ámbito'),
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
                    label="Código de Marca"
                    placeholder="Ej: BOS"
                    {...form.getInputProps('codigo_marca')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Marca"
                    placeholder="Ej: Bosch"
                    {...form.getInputProps('nombre_marca')}
                />
                <Select
                    withAsterisk
                    label="Ámbito de la Marca"
                    placeholder="Seleccione un ámbito"
                    data={Object.values(AmbitoMarca)}
                    {...form.getInputProps('ambito_marca')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción de la marca"
                    rows={3}
                    {...form.getInputProps('descripcion')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Marca
                </Button>
            </Stack>
        </form>
    );
}
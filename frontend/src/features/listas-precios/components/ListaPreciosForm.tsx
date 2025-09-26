// frontend/src/features/listas-precios/components/ListaPreciosForm.tsx
import { TextInput, Button, Stack, Textarea, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { ListaPreciosFormData } from '../types';

interface ListaPreciosFormProps {
    onSubmit: (values: ListaPreciosFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<ListaPreciosFormData> | null;
}

export function ListaPreciosForm({ onSubmit, isSubmitting, initialValues }: ListaPreciosFormProps) {
    const form = useForm<ListaPreciosFormData>({
        initialValues: {
            codigo_lista_precios: '',
            nombre_lista_precios: '',
            descripcion_lista_precios: '',
            moneda: 'CLP',
        },
        validate: {
            codigo_lista_precios: isNotEmpty('El código es requerido'),
            nombre_lista_precios: isNotEmpty('El nombre es requerido'),
            moneda: isNotEmpty('La moneda es requerida'),
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
                    label="Código"
                    placeholder="Ej: LISTA_MAYORISTA"
                    {...form.getInputProps('codigo_lista_precios')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Lista"
                    placeholder="Ej: Lista de Precios Mayorista"
                    {...form.getInputProps('nombre_lista_precios')}
                />
                 <Select
                    withAsterisk
                    label="Moneda"
                    data={['CLP', 'USD', 'EUR']}
                    {...form.getInputProps('moneda')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción de la lista de precios"
                    rows={2}
                    {...form.getInputProps('descripcion_lista_precios')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
// src/features/valores-atributo/components/ValorAtributoForm.tsx
import { TextInput, Button, Stack } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { ValorAtributoFormData } from '../types';
import { useEffect } from 'react';

interface ValorAtributoFormProps {
    onSubmit: (values: ValorAtributoFormData) => void;
    initialValues?: Partial<ValorAtributoFormData> | null;
    isSubmitting: boolean;
}

export function ValorAtributoForm({ onSubmit, initialValues, isSubmitting }: ValorAtributoFormProps) {
    const form = useForm<ValorAtributoFormData>({
        initialValues: {
            codigo: initialValues?.codigo || '',
            valor: initialValues?.valor || '',
        },
        validate: {
            codigo: isNotEmpty('El código es requerido'),
            valor: isNotEmpty('El valor es requerido'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo: initialValues.codigo,
                valor: initialValues.valor,
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código" placeholder="Ej: IZQ" {...form.getInputProps('codigo')} />
                <TextInput withAsterisk label="Valor" placeholder="Ej: Izquierdo" {...form.getInputProps('valor')} />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar Valor</Button>
            </Stack>
        </form>
    );
}
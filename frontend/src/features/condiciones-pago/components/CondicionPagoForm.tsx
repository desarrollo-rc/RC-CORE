// frontend/src/features/condiciones-pago/components/CondicionPagoForm.tsx
import { TextInput, Button, Stack, Textarea, NumberInput, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { CondicionPagoFormData } from '../types';

interface CondicionPagoFormProps {
    onSubmit: (values: CondicionPagoFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<CondicionPagoFormData> | null;
}

export function CondicionPagoForm({ onSubmit, isSubmitting, initialValues }: CondicionPagoFormProps) {
    const form = useForm<CondicionPagoFormData>({
        initialValues: {
            codigo_condicion_pago: '',
            nombre_condicion_pago: '',
            descripcion_condicion_pago: '',
            dias_credito: 0,
            ambito: 'VENTA',
        },
        validate: {
            codigo_condicion_pago: isNotEmpty('El código es requerido'),
            nombre_condicion_pago: isNotEmpty('El nombre es requerido'),
            dias_credito: (value) => (value !== '' && value >= 0 ? null : 'Debe ser un número igual or mayor a 0'),
            ambito: isNotEmpty('El ámbito es requerido'),
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
                    placeholder="Ej: CRED30"
                    {...form.getInputProps('codigo_condicion_pago')}
                />
                <TextInput
                    withAsterisk
                    label="Nombre de la Condición"
                    placeholder="Ej: Crédito a 30 días"
                    {...form.getInputProps('nombre_condicion_pago')}
                />
                <NumberInput
                    withAsterisk
                    label="Días de Crédito"
                    placeholder="Ej: 30"
                    min={0}
                    {...form.getInputProps('dias_credito')}
                />
                <Select
                    withAsterisk
                    label="Ámbito"
                    data={['VENTA', 'COMPRA']}
                    {...form.getInputProps('ambito')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Breve descripción de la condición de pago"
                    rows={2}
                    {...form.getInputProps('descripcion_condicion_pago')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
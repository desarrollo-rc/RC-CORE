// frontend/src/features/codigos-referencia/components/MedidaAsignadaForm.tsx

import { Button, Stack, Select, NumberInput } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { Medida } from '../../medidas/types';
import type { MedidaAsignadaFormData } from '../types';

interface MedidaAsignadaFormProps {
    onSubmit: (values: MedidaAsignadaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<MedidaAsignadaFormData> | null;
    availableMedidas: Medida[];
}

export function MedidaAsignadaForm({ onSubmit, isSubmitting, initialValues, availableMedidas }: MedidaAsignadaFormProps) {
    const form = useForm<MedidaAsignadaFormData>({
        initialValues: {
            id_medida: initialValues?.id_medida || null,
            valor: initialValues?.valor || '',
        },
        validate: {
            id_medida: isNotEmpty('Debe seleccionar una medida'),
            valor: (value) => (Number(value) > 0 ? null : 'El valor debe ser mayor a 0'), // <-- CAMBIO: Castear a Number para validar
        },
    });
    
    useEffect(() => {
        if (initialValues) {
            form.setValues({
                id_medida: initialValues.id_medida || null,
                valor: initialValues.valor || '',
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    const medidasOptions = availableMedidas.map(m => ({ value: m.id_medida.toString(), label: `${m.nombre} (${m.unidad})` }));

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <Select
                    withAsterisk
                    label="Medida"
                    placeholder="Seleccione una medida para asignar"
                    data={medidasOptions}
                    searchable
                    disabled={!!initialValues}
                    {...form.getInputProps('id_medida')}
                />
                <NumberInput
                    withAsterisk
                    label="Valor"
                    placeholder="Ingrese el valor de la medida"
                    decimalScale={2}
                    min={0}
                    {...form.getInputProps('valor')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
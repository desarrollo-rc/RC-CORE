// frontend/src/features/codigos-referencia/components/AtributoAsignadoForm.tsx
import { Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect, useMemo, useState } from 'react';
import type { Atributo } from '../../atributos/types';
import type { AtributoAsignadoFormData } from '../types';

interface AtributoAsignadoFormProps {
    onSubmit: (values: AtributoAsignadoFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<AtributoAsignadoFormData> | null;
    availableAtributos: Atributo[];
}

export function AtributoAsignadoForm({ onSubmit, isSubmitting, initialValues, availableAtributos }: AtributoAsignadoFormProps) {
    const form = useForm<AtributoAsignadoFormData>({
        initialValues: { id_atributo: null, id_valor: null },
        validate: {
            id_atributo: isNotEmpty('Debe seleccionar un atributo'),
            id_valor: isNotEmpty('Debe seleccionar un valor'),
        },
    });

    const [selectedAtributoId, setSelectedAtributoId] = useState<string | null>(initialValues?.id_atributo || null);

    useEffect(() => {
        if (initialValues) {
            form.setValues(initialValues);
            setSelectedAtributoId(initialValues.id_atributo || null);
        } else {
            form.reset();
            setSelectedAtributoId(null);
        }
    }, [initialValues]);

    const atributosOptions = availableAtributos.map(a => ({ value: a.id_atributo.toString(), label: a.nombre }));
    
    const valoresOptions = useMemo(() => {
        if (!selectedAtributoId) return [];
        const selected = availableAtributos.find(a => a.id_atributo.toString() === selectedAtributoId);
        return selected?.valores.map(v => ({ value: v.id_valor.toString(), label: v.valor })) || [];
    }, [selectedAtributoId, availableAtributos]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <Select
                    withAsterisk
                    label="Atributo"
                    placeholder="Seleccione un atributo"
                    data={atributosOptions}
                    searchable
                    disabled={!!initialValues}
                    {...form.getInputProps('id_atributo')}
                    onChange={(value) => {
                        form.setFieldValue('id_atributo', value);
                        form.setFieldValue('id_valor', null); // Reset valor when atributo changes
                        setSelectedAtributoId(value);
                    }}
                />
                <Select
                    withAsterisk
                    label="Valor"
                    placeholder={selectedAtributoId ? "Seleccione un valor" : "Seleccione un atributo primero"}
                    data={valoresOptions}
                    searchable
                    disabled={!selectedAtributoId || valoresOptions.length === 0}
                    {...form.getInputProps('id_valor')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar
                </Button>
            </Stack>
        </form>
    );
}
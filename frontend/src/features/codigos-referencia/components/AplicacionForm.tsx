// frontend/src/features/codigos-referencia/components/AplicacionForm.tsx

import { Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { AplicacionPayload } from '../types';
import type { MarcaVehiculo, Modelo, VersionVehiculo } from '../../vehiculos/types';
import { useMemo } from 'react';

interface AplicacionFormProps {
    marcas: MarcaVehiculo[];
    modelos: Modelo[];
    versiones: VersionVehiculo[];
    onSubmit: (payload: AplicacionPayload) => void;
    isSubmitting: boolean;
}

export function AplicacionForm({ marcas, modelos, versiones, onSubmit, isSubmitting }: AplicacionFormProps) {
    const form = useForm<{ id_marca: string | null; id_modelo: string | null; id_version: string | null }>({
        initialValues: { id_marca: null, id_modelo: null, id_version: null },
        validate: { id_version: isNotEmpty('Debe seleccionar una versión') },
    });

    const modelosOptions = useMemo(() => {
        if (!form.values.id_marca) return [];
        return modelos.filter(m => m.id_marca === Number(form.values.id_marca))
            .map(m => ({ value: String(m.id_modelo), label: m.nombre_modelo }));
    }, [form.values.id_marca, modelos]);

    const versionesOptions = useMemo(() => {
        if (!form.values.id_modelo) return [];
        return versiones.filter(v => v.id_modelo === Number(form.values.id_modelo))
            .map(v => ({ value: String(v.id_version), label: v.nombre_version }));
    }, [form.values.id_modelo, versiones]);

    return (
        <form onSubmit={form.onSubmit((vals) => onSubmit({ id_version: Number(vals.id_version) }))}>
            <Stack>
                <Select
                    label="Marca"
                    data={marcas.map(m => ({ value: String(m.id_marca), label: m.nombre_marca }))}
                    {...form.getInputProps('id_marca')}
                    onChange={(v) => { form.setFieldValue('id_marca', v); form.setFieldValue('id_modelo', null); form.setFieldValue('id_version', null); }}
                />
                <Select
                    label="Modelo"
                    data={modelosOptions}
                    disabled={!form.values.id_marca || modelosOptions.length === 0}
                    {...form.getInputProps('id_modelo')}
                    onChange={(v) => { form.setFieldValue('id_modelo', v); form.setFieldValue('id_version', null); }}
                />
                <Select
                    withAsterisk
                    label="Versión"
                    data={versionesOptions}
                    disabled={!form.values.id_modelo || versionesOptions.length === 0}
                    {...form.getInputProps('id_version')}
                />
                <Button type="submit" loading={isSubmitting}>Asociar</Button>
            </Stack>
        </form>
    );
}



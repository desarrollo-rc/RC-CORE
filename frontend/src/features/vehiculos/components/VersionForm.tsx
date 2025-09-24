// frontend/src/features/vehiculos/components/VersionForm.tsx
import { TextInput, Button, Stack, NumberInput, TagsInput, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import type { VersionFormData } from '../types';

interface VersionFormProps {
    onSubmit: (values: VersionFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<VersionFormData> | null;
}

const opcionesTransmision = ['MANUAL', 'AUTOMATICA', 'CVT', 'DOBLE_EMBRAGUE', 'OTRO'];
const opcionesTraccion = ['DELANTERA', 'TRASERA', 'TOTAL_4X4', 'INTEGRAL_AWD'];
const opcionesCombustible = ['GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO', 'GLP', 'GNV'];

export function VersionForm({ onSubmit, isSubmitting, initialValues }: VersionFormProps) {

    const form = useForm<VersionFormData>({
        initialValues: {
            nombre_version: '',
            detalle_motor: '',
            cilindrada: null,
            anios_fabricacion: [],
            transmision: null,
            traccion: null,
            combustible: null,
        },
        validate: {
            nombre_version: isNotEmpty('El nombre es requerido'),
            anios_fabricacion: (value) => (value.length > 0 ? null : 'Debe ingresar al menos un año'),
        },
    });

    useEffect(() => {
        form.setValues({
            nombre_version: initialValues?.nombre_version || '',
            detalle_motor: initialValues?.detalle_motor || '',
            cilindrada: initialValues?.cilindrada || null,
            anios_fabricacion: initialValues?.anios_fabricacion || [],
            transmision: initialValues?.transmision || null,
            traccion: initialValues?.traccion || null,
            combustible: initialValues?.combustible || null,
        });
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit((values) => onSubmit({
                ...values,
                cilindrada: Number(values.cilindrada) || null,
                detalle_motor: values.detalle_motor || null,
            }))}>
            <Stack>
                <TextInput withAsterisk label="Nombre Versión" placeholder="Ej: 1.5 GLI AT" {...form.getInputProps('nombre_version')} />
                <TextInput label="Detalle Motor" placeholder="Ej: 1NZ-FE" {...form.getInputProps('detalle_motor')} />
                <NumberInput label="Cilindrada (cc)" placeholder="Ej: 1497" {...form.getInputProps('cilindrada')} />
                <Select label="Transmisión" placeholder="Seleccione una opción" data={opcionesTransmision} clearable {...form.getInputProps('transmision')} />
                <Select label="Tracción" placeholder="Seleccione una opción" data={opcionesTraccion} clearable {...form.getInputProps('traccion')} />
                <Select label="Combustible" placeholder="Seleccione una opción" data={opcionesCombustible} clearable {...form.getInputProps('combustible')} />
                <TagsInput
                    label="Años de Fabricación"
                    placeholder="Escriba un año y presione Enter"
                    withAsterisk
                    value={form.values.anios_fabricacion.map(String)}
                    onChange={(valuesAsString) => {
                        const valuesAsNumber = valuesAsString
                            .map((v) => parseInt(v, 10))
                            .filter((n) => !isNaN(n) && n > 1950 && n < 2050);
                        form.setFieldValue('anios_fabricacion', valuesAsNumber);
                    }}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar Versión</Button>
            </Stack>
        </form>
    );
}
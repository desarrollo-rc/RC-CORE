// frontend/src/features/vehiculos/components/MarcaForm.tsx
import { TextInput, Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect } from 'react';
import { AmbitoMarca } from '../../marcas/types'; // Reutilizamos el tipo
import type { MarcaVehiculo } from '../types';

// Usaremos un tipo específico para el formulario
type MarcaFormData = {
    codigo_marca: string;
    nombre_marca: string;
    ambito_marca: AmbitoMarca | string;
};

interface MarcaFormProps {
    onSubmit: (values: MarcaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<MarcaVehiculo> & { ambito_marca?: AmbitoMarca | string } | null;
}

export function MarcaForm({ onSubmit, isSubmitting, initialValues }: MarcaFormProps) {
    const form = useForm<MarcaFormData>({
        initialValues: {
            codigo_marca: '',
            nombre_marca: '',
            ambito_marca: '',
        },
        validate: {
            codigo_marca: isNotEmpty('El código es requerido'),
            nombre_marca: isNotEmpty('El nombre es requerido'),
            ambito_marca: isNotEmpty('Debe seleccionar un ámbito'),
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.setValues({
                codigo_marca: initialValues.codigo_marca || '',
                nombre_marca: initialValues.nombre_marca || '',
                ambito_marca: initialValues.ambito_marca || '',
            });
        } else {
            form.reset();
        }
    }, [initialValues]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="Código de Marca" placeholder="Ej: BOS" {...form.getInputProps('codigo_marca')} />
                <TextInput withAsterisk label="Nombre de la Marca" placeholder="Ej: Bosch" {...form.getInputProps('nombre_marca')} />
                <Select
                    withAsterisk
                    label="Ámbito"
                    placeholder="Seleccione el tipo de marca"
                    data={Object.values(AmbitoMarca)}
                    {...form.getInputProps('ambito_marca')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar Marca</Button>
            </Stack>
        </form>
    );
}
// frontend/src/features/origenes/components/OrigenForm.tsx
import { Button, Stack, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import type { OrigenFormData } from '../types';
import type { Pais } from '../../paises/types';

interface OrigenFormProps {
    onSubmit: (values: OrigenFormData) => void;
    isSubmitting: boolean;
    paisesDisponibles: Pais[];
}

export function OrigenForm({ onSubmit, isSubmitting, paisesDisponibles }: OrigenFormProps) {
    const paisesData = paisesDisponibles.map(pais => ({
        value: pais.id_pais.toString(),
        label: pais.nombre_pais,
    }));

    const form = useForm<OrigenFormData>({
        initialValues: { id_pais: null },
        validate: { id_pais: isNotEmpty('Debe seleccionar un país') },
    });

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <Select
                    withAsterisk
                    label="País para añadir como origen"
                    placeholder="Seleccione un país de la lista"
                    data={paisesData}
                    searchable
                    {...form.getInputProps('id_pais')}
                />
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Añadir Origen
                </Button>
            </Stack>
        </form>
    );
}
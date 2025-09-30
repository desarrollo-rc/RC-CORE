// frontend/src/features/canales-venta/components/CanalVentaSelect.tsx
import { useEffect, useState } from 'react';
import { Select } from '@mantine/core';
import { Controller, type Control } from 'react-hook-form';
import { getCanalesVenta } from '../services/canalVentaService';
import type { CanalVenta } from '../types';

interface CanalVentaSelectProps {
    control: Control<any>;
    name: string;
    label: string;
    error?: string;
}

interface SelectOption {
    value: string;
    label: string;
}

export function CanalVentaSelect({ control, name, label, error }: CanalVentaSelectProps) {
    const [canales, setCanales] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCanales = async () => {
            try {
                const data = await getCanalesVenta();
                const options = data.map((canal: CanalVenta) => ({
                    value: canal.id_canal.toString(),
                    label: canal.nombre || 'Canal sin nombre',
                }));
                setCanales(options);
            } catch (error) {
                console.error("Error al cargar canales de venta:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCanales();
    }, []);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <Select
                    label={label}
                    placeholder="Seleccione un canal de venta"
                    data={canales}
                    searchable
                    clearable
                    nothingFoundMessage="No se encontraron canales"
                    disabled={loading}
                    {...field}
                    error={error}
                />
            )}
        />
    );
}
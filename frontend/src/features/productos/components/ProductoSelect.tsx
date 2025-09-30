// frontend/src/features/productos/components/ProductoSelect.tsx
import { useEffect, useState } from 'react';
import { Select } from '@mantine/core';
import { Controller, type Control } from 'react-hook-form';
import { getAllProductos } from '../services/productoService';
import type { Producto } from '../types'; // Asegúrate que el tipo Producto esté bien definido aquí

interface ProductoSelectProps {
    control: Control<any>;
    name: string;
    error?: string;
}

interface SelectOption {
    value: string;
    label: string;
}

export function ProductoSelect({ control, name, error }: ProductoSelectProps) {
    const [productos, setProductos] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const data = await getAllProductos();
                const options = data.map((producto: Producto) => ({
                    value: producto.id_producto.toString(),
                    label: `${producto.sku} - ${producto.nombre_producto || 'Producto sin nombre'}`, 
                  }));
                setProductos(options);
            } catch (error) {
                console.error("Error al cargar productos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <Select
                    placeholder="Busque por SKU o nombre"
                    data={productos}
                    searchable
                    clearable
                    nothingFoundMessage="No se encontraron productos"
                    disabled={loading}
                    {...field}
                    error={error}
                />
            )}
        />
    );
}
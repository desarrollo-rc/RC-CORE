// frontend/src/features/clientes/components/ClienteSelect.tsx
import { useEffect, useState } from 'react';
import { Select } from '@mantine/core';
import { Controller, type Control } from 'react-hook-form';
import { fetchAllClientes } from '../services/clienteService';
import type { Cliente } from '../types';

interface ClienteSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  error?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export function ClienteSelect({ control, name, label, error }: ClienteSelectProps) {
  const [clientes, setClientes] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const list = await fetchAllClientes();
        const options = list.map((cliente: Cliente) => ({
          value: cliente.id_cliente.toString(),
          label: `${cliente.codigo_cliente} - ${cliente.nombre_cliente}`,
        }));
        setClientes(options);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        // Manejar error, quizás con una notificación
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          label={label}
          placeholder="Busque o seleccione un cliente"
          data={clientes}
          searchable
          clearable
          nothingFoundMessage="No se encontraron clientes"
          disabled={loading}
          {...field}
          error={error}
        />
      )}
    />
  );
}
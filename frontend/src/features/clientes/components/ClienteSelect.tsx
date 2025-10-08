// frontend/src/features/clientes/components/ClienteSelect.tsx
import { useEffect, useState } from 'react';
import { Select, type SelectProps } from '@mantine/core';
import { Controller, type Control } from 'react-hook-form';
import { fetchAllClientes } from '../services/clienteService';
import type { Cliente } from '../types';

interface SelectOption {
  value: string;
  label: string;
}

// Props cuando se usa con react-hook-form
interface ClienteSelectWithControlProps extends Omit<SelectProps, 'data'> {
  control: Control<any>;
  name: string;
  label?: string;
  error?: string;
}

// Props cuando se usa con Mantine form o standalone
interface ClienteSelectStandaloneProps extends Omit<SelectProps, 'data'> {
  control?: never;
  name?: never;
  label?: string;
  value?: string;
  onChange?: (value: string | null) => void;
  error?: string | boolean;
}

type ClienteSelectProps = ClienteSelectWithControlProps | ClienteSelectStandaloneProps;

export function ClienteSelect(props: ClienteSelectProps) {
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
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Si tiene control, usar react-hook-form
  if ('control' in props && props.control) {
    const { control, name, label, error, ...rest } = props;
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
            {...rest}
          />
        )}
      />
    );
  }

  // Modo standalone (para Mantine form)
  const { label, value, onChange, error, ...rest } = props as ClienteSelectStandaloneProps;
  return (
    <Select
      label={label}
      placeholder="Busque o seleccione un cliente"
      data={clientes}
      searchable
      clearable
      nothingFoundMessage="No se encontraron clientes"
      disabled={loading}
      value={value}
      onChange={onChange}
      error={error}
      {...rest}
    />
  );
}
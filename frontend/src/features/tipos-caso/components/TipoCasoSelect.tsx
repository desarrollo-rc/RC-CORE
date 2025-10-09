// frontend/src/features/tipos-caso/components/TipoCasoSelect.tsx
import { useEffect, useState } from 'react';
import { Select, type SelectProps } from '@mantine/core';
import { getTiposCasoActivos } from '../services/tipoCasoService';
import type { TipoCaso } from '../types';

interface SelectOption {
  value: string;
  label: string;
}

interface TipoCasoSelectProps extends Omit<SelectProps, 'data'> {
  label?: string;
  value?: string;
  onChange?: (value: string | null) => void;
  error?: string | boolean;
}

export function TipoCasoSelect({ label, value, onChange, error, ...rest }: TipoCasoSelectProps) {
  const [tipos, setTipos] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const list = await getTiposCasoActivos();
        const options = list.map((tipo: TipoCaso) => ({
          value: tipo.id_tipo_caso.toString(),
          label: `${tipo.nombre_tipo_caso} (${tipo.codigo_tipo_caso})`,
        }));
        setTipos(options);
      } catch (error) {
        console.error("Error al cargar tipos de caso:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTipos();
  }, []);

  return (
    <Select
      label={label || "Tipo de Caso"}
      placeholder="Seleccione un tipo de caso"
      data={tipos}
      searchable
      clearable
      nothingFoundMessage="No se encontraron tipos de caso"
      disabled={loading}
      value={value}
      onChange={onChange}
      error={error}
      {...rest}
    />
  );
}


// frontend/src/features/usuarios-b2b/components/UsuarioB2BSelect.tsx
import { useEffect, useState } from 'react';
import { Select, type SelectProps } from '@mantine/core';
import { getUsuariosB2B, getUsuariosB2BByCliente } from '../services/usuarioB2BService';
import type { UsuarioB2B } from '../types';

interface SelectOption {
  value: string;
  label: string;
}

interface UsuarioB2BSelectProps extends Omit<SelectProps, 'data'> {
  idCliente?: number; // Filtrar por cliente
  label?: string;
  value?: string;
  onChange?: (value: string | null) => void;
  error?: string | boolean;
}

export function UsuarioB2BSelect({ idCliente, label, value, onChange, error, ...rest }: UsuarioB2BSelectProps) {
  const [usuarios, setUsuarios] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsuarios = async () => {
      // Si no hay cliente seleccionado, limpiar la lista
      if (!idCliente) {
        setUsuarios([]);
        return;
      }

      setLoading(true);
      try {
        // Usar el endpoint específico por cliente cuando hay idCliente
        const list = await getUsuariosB2BByCliente(idCliente);
        
        // Filtrar solo usuarios activos
        const filteredList = list.filter((u: UsuarioB2B) => u.activo);
        
        const options = filteredList.map((usuario: UsuarioB2B) => ({
          value: usuario.id_usuario_b2b.toString(),
          label: `${usuario.nombre_completo} (${usuario.usuario})`,
        }));
        setUsuarios(options);
      } catch (error) {
        console.error("Error al cargar usuarios B2B:", error);
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [idCliente]);

  return (
    <Select
      label={label || "Usuario B2B"}
      placeholder={idCliente ? "Seleccione un usuario B2B" : "Primero seleccione un cliente"}
      data={usuarios}
      searchable
      clearable
      nothingFoundMessage={idCliente ? "No se encontraron usuarios B2B activos para este cliente" : "Seleccione un cliente primero"}
      disabled={loading || !idCliente}
      value={value}
      onChange={onChange}
      error={error}
      {...rest}
    />
  );
}


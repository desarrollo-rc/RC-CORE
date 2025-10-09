// frontend/src/features/usuarios-b2b/components/UsuarioB2BSelect.tsx
import { useEffect, useState } from 'react';
import { Select, type SelectProps } from '@mantine/core';
import { getUsuariosB2B } from '../services/usuarioB2BService';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const list = await getUsuariosB2B();
        // Filtrar por cliente si se proporciona
        const filteredList = idCliente 
          ? list.filter((u: UsuarioB2B) => u.id_cliente === idCliente && u.activo)
          : list.filter((u: UsuarioB2B) => u.activo);
        
        const options = filteredList.map((usuario: UsuarioB2B) => ({
          value: usuario.id_usuario_b2b.toString(),
          label: `${usuario.nombre_completo} (${usuario.usuario})`,
        }));
        setUsuarios(options);
      } catch (error) {
        console.error("Error al cargar usuarios B2B:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [idCliente]);

  return (
    <Select
      label={label || "Usuario B2B"}
      placeholder="Seleccione un usuario B2B"
      data={usuarios}
      searchable
      clearable
      nothingFoundMessage="No se encontraron usuarios B2B"
      disabled={loading}
      value={value}
      onChange={onChange}
      error={error}
      {...rest}
    />
  );
}


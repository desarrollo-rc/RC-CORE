// frontend/src/features/proveedores/types/index.ts
import type { Pais } from '../../paises/types';

export interface Proveedor {
    id_proveedor: number;
    codigo_proveedor: string;
    nombre_proveedor: string;
    rut_proveedor: string;
    id_pais: number;
    direccion: string | null;
    telefono: string | null;
    email: string | null;
    activo: boolean;
    pais: Pais;
}

export type ProveedorPayload = Omit<Proveedor, 'id_proveedor' | 'activo' | 'pais'>;

export type ProveedorFormData = {
    codigo_proveedor: string;
    nombre_proveedor: string;
    rut_proveedor: string;
    id_pais: string | null;
    direccion: string;
    telefono: string;
    email: string;
};
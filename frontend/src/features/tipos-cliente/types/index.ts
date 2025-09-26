// frontend/src/features/tipos-cliente/types/index.ts

export interface TipoCliente {
    id_tipo_cliente: number;
    codigo_tipo_cliente: string;
    nombre_tipo_cliente: string;
    descripcion_tipo_cliente: string | null;
    activo: boolean;
}

export type TipoClientePayload = Omit<TipoCliente, 'id_tipo_cliente' | 'activo'>;

export type TipoClienteFormData = {
    codigo_tipo_cliente: string;
    nombre_tipo_cliente: string;
    descripcion_tipo_cliente: string;
};
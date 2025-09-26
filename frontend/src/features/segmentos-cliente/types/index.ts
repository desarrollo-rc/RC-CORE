// frontend/src/features/segmentos-cliente/types/index.ts

export interface SegmentoCliente {
    id_segmento_cliente: number;
    codigo_segmento_cliente: string;
    nombre_segmento_cliente: string;
    descripcion_segmento_cliente: string | null;
    activo: boolean;
}

export type SegmentoClientePayload = Omit<SegmentoCliente, 'id_segmento_cliente' | 'activo'>;

export type SegmentoClienteFormData = {
    codigo_segmento_cliente: string;
    nombre_segmento_cliente: string;
    descripcion_segmento_cliente: string;
};
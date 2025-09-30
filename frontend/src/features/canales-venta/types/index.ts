// frontend/src/features/canales-venta/types/index.ts
export interface CanalVenta {
    id_canal: number;
    codigo_canal: string;
    nombre: string;
    activo: boolean;
}

export interface PaginatedCanalesVentaResponse {
    items: CanalVenta[];
    pagination: {
        total: number;
        pages: number;
        page: number;
        per_page: number;
    };
}
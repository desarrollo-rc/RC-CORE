// src/features/areas/types/index.ts

export interface Area {
    id_area: number;
    codigo_area: string;
    nombre_area: string;
    descripcion_area?: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;
}

export type AreaPayload = {
    codigo_area: string;
    nombre_area: string;
    descripcion_area?: string;
};
// frontend/src/features/tipos-negocio/types/index.ts

export interface TipoNegocio {
    id_tipo_negocio: number;
    codigo_tipo_negocio: string;
    nombre_tipo_negocio: string;
    descripcion_tipo_negocio: string | null;
    activo: boolean;
}

export type TipoNegocioPayload = Omit<TipoNegocio, 'id_tipo_negocio' | 'activo'>;

export type TipoNegocioFormData = {
    codigo_tipo_negocio: string;
    nombre_tipo_negocio: string;
    descripcion_tipo_negocio: string;
};
// frontend/src/features/tipos-caso/types/index.ts

export type CategoriaTipoCaso = 
    | 'INSTALACION_CLIENTE_NUEVO'
    | 'INSTALACION_USUARIO_NUEVO'
    | 'INSTALACION_USUARIO_ADICIONAL'
    | 'INSTALACION_CAMBIO_EQUIPO'
    | 'SOPORTE_TECNICO'
    | 'CONSULTA'
    | 'BLOQUEO'
    | 'OTRO';

export interface TipoCaso {
    id_tipo_caso: number;
    codigo_tipo_caso: string;
    nombre_tipo_caso: string;
    descripcion_tipo_caso: string | null;
    categoria_uso: CategoriaTipoCaso | null;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion?: string;
}

export interface CrearTipoCasoPayload {
    codigo_tipo_caso: string;
    nombre_tipo_caso: string;
    descripcion_tipo_caso?: string;
    categoria_uso?: CategoriaTipoCaso;
}

export interface ActualizarTipoCasoPayload {
    codigo_tipo_caso?: string;
    nombre_tipo_caso?: string;
    descripcion_tipo_caso?: string;
    categoria_uso?: CategoriaTipoCaso;
}


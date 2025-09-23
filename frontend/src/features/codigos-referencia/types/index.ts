// frontend/src/features/codigos-referencia/types/index.ts

import type { ClasificacionEstadistica } from "../../clasificaciones-estadistica/types";
import type { ClasificacionServicio } from "../../clasificaciones-servicio/types";

export const TipoCodigoTecnico = {
    OEM: 'OEM',
    SKU: 'SKU',
    PLAZA: 'PLAZA',
    OTRO: 'OTRO',
} as const;
export type TipoCodigoTecnico = typeof TipoCodigoTecnico[keyof typeof TipoCodigoTecnico];

export interface CodigoTecnico {
    id_codigo_tecnico: number;
    codigo: string;
    tipo: TipoCodigoTecnico;
    activo: boolean;
}

export interface CodigoReferencia {
    id_codigo_referencia: number;
    codigo: string;
    descripcion: string | null;
    id_sub_categoria: number;
    id_det_sub_categoria: number | null;
    id_clasificacion_servicio: number | null;
    id_clasificacion_estadistica: number | null;
    activo: boolean;

    codigos_tecnicos: CodigoTecnico[];
    clasificacion_servicio: ClasificacionServicio | null;
    clasificacion_estadistica: ClasificacionEstadistica | null;
}

export type CodigoReferenciaPayload = Pick<CodigoReferencia, 'codigo' | 'descripcion' | 'id_sub_categoria' | 'id_det_sub_categoria' | 'id_clasificacion_servicio' | 'id_clasificacion_estadistica'>;
export type CodigoTecnicoPayload = Pick<CodigoTecnico, 'codigo' | 'tipo'> & { id_codigo_referencia: number };

export type CodigoReferenciaFormData = {
    codigo: string;
    descripcion: string;
    id_division: string | null;
    id_categoria: string | null;
    id_sub_categoria: string | null;
    id_det_sub_categoria: string | null;
    id_clasificacion_servicio: string | null;
    id_clasificacion_estadistica: string | null;
};

export type CodigoTecnicoFormData = {
    codigo: string;
    tipo: TipoCodigoTecnico | string;
};
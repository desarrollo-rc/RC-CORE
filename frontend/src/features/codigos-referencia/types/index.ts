// frontend/src/features/codigos-referencia/types/index.ts

import type { Atributo, ValorAtributo } from "../../atributos/types";
import type { ClasificacionEstadistica } from "../../clasificaciones-estadistica/types";
import type { ClasificacionServicio } from "../../clasificaciones-servicio/types";
import type { Medida } from "../../medidas/types";

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

export interface MedidaAsignada {
    id_codigo_referencia: number;
    id_medida: number;
    valor: number;
    medida: Medida;
}

// --- INTERFAZ PARA ATRIBUTOS ASIGNADOS ---
export interface AtributoAsignado {
    id_codigo_referencia: number;
    id_atributo: number;
    id_valor: number;
    atributo: Atributo;
    valor_asignado: ValorAtributo;
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
    medidas_asignadas: MedidaAsignada[];
    atributos_asignados: AtributoAsignado[];
    aplicaciones: Aplicacion[];
    clasificacion_servicio: ClasificacionServicio | null;
    clasificacion_estadistica: ClasificacionEstadistica | null;
}

export type CodigoReferenciaPayload = Pick<CodigoReferencia, 'codigo' | 'descripcion' | 'id_sub_categoria' | 'id_det_sub_categoria' | 'id_clasificacion_servicio' | 'id_clasificacion_estadistica'>;
export type CodigoTecnicoPayload = Pick<CodigoTecnico, 'codigo' | 'tipo'> & { id_codigo_referencia: number };
export type MedidaAsignadaPayload = Pick<MedidaAsignada, 'id_medida' | 'valor'>;
export type AtributoAsignadoPayload = Pick<AtributoAsignado, 'id_atributo' | 'id_valor'>;

// --- APLICACIONES (Vehículos asociados) ---
export interface Aplicacion {
    id_codigo_referencia: number;
    // Compatibilidad: algunos backends retornan id_version, otros usan version_vehiculo anidado
    id_version?: number;
    version?: {
        id_version: number;
        nombre_version: string;
        modelo: {
            id_modelo: number;
            nombre_modelo: string;
            id_marca: number;
            marca?: { id_marca: number; nombre_marca: string };
        };
    };
    // Campos alineados al backend actual
    version_vehiculo?: {
        id_version: number;
        nombre_version: string;
        anios_fabricacion?: number[];
    };
    modelo_info?: {
        nombre_modelo: string;
        marca?: { nombre_marca: string };
    };
}

export type AplicacionPayload = { id_version: number };

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

export type MedidaAsignadaFormData = {
    id_medida: string | null; // <-- CAMBIO: string | null para el Select
    valor: number | '';       // <-- CAMBIO: number | '' para el NumberInput
};

export type AtributoAsignadoFormData = {
    id_atributo: string | null;
    id_valor: string | null;
};
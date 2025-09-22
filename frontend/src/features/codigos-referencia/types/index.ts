// frontend/src/features/codigos-referencia/types/index.ts

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
    activo: boolean;
    codigos_tecnicos: CodigoTecnico[];
}

export type CodigoReferenciaPayload = Pick<CodigoReferencia, 'codigo' | 'descripcion' | 'id_sub_categoria'>;
export type CodigoTecnicoPayload = Pick<CodigoTecnico, 'codigo' | 'tipo'> & { id_codigo_referencia: number };

export type CodigoReferenciaFormData = {
    codigo: string;
    descripcion: string;
    id_sub_categoria: string | null;
};

export type CodigoTecnicoFormData = {
    codigo: string;
    tipo: TipoCodigoTecnico | string;
};
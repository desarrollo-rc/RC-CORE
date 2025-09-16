// src/features/productos/medidas/types/index.ts

export interface Medida {
    id_medida: number;
    codigo: string;
    nombre: string;
    unidad: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string | null;
}

export type MedidaPayload = Pick<Medida, 'codigo' | 'nombre' | 'unidad'>;

export type MedidaFormData = {
    codigo: string;
    nombre: string;
    unidad: string;
};
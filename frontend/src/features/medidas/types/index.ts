// src/features/productos/medidas/types/index.ts

export interface Medida {
    id_medida: number;
    nombre: string;
    unidad: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string | null;
}

export type MedidaPayload = Pick<Medida, 'nombre' | 'unidad'>;

export type MedidaFormData = {
    nombre: string;
    unidad: string;
};
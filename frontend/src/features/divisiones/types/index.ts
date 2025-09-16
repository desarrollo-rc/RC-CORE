// src/features/productos/divisiones/types/index.ts

export interface Division {
    id_division: number;
    codigo_division: string;
    nombre_division: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string | null;
}

export type DivisionPayload = Pick<Division, 'codigo_division' | 'nombre_division'>;

export type DivisionFormData = {
    codigo_division: string;
    nombre_division: string;
};
// frontend/src/features/calidades/types/index.ts

export interface Calidad {
    id_calidad: number;
    codigo_calidad: string;
    nombre_calidad: string;
    descripcion?: string | null;
    activo: boolean;
}

export type CalidadPayload = Omit<Calidad, 'id_calidad' | 'activo'>;

export type CalidadFormData = {
    codigo_calidad: string;
    nombre_calidad: string;
    descripcion: string;
};
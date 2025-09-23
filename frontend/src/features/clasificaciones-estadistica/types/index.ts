// frontend/src/features/clasificaciones-estadistica/types/index.ts

export interface ClasificacionEstadistica {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
}

export type ClasificacionEstadisticaPayload = Omit<ClasificacionEstadistica, 'id' | 'activo'>;

export type ClasificacionEstadisticaFormData = {
    codigo: string;
    nombre: string;
};
// frontend/src/features/clasificaciones-servicio/types/index.ts

// Interfaz para el objeto que recibimos de la API
export interface ClasificacionServicio {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
}

// Tipo para el payload que enviamos al crear/actualizar
export type ClasificacionServicioPayload = Omit<ClasificacionServicio, 'id' | 'activo'>;

// Tipo para los datos del formulario de Mantine
export type ClasificacionServicioFormData = {
    codigo: string;
    nombre: string;
};
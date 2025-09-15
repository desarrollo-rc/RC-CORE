// src/features/permisos/types/index.ts

export interface Permiso {
    id_permiso: number;
    nombre_permiso: string;
    descripcion_permiso: string | null;
}

export type PermisoPayload = Omit<Permiso, 'id_permiso'>;
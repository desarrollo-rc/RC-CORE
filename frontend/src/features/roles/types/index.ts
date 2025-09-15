// src/features/roles/types/index.ts

import type { Permiso } from '../../permisos/types';

export interface Rol {
    id_rol: number;
    nombre_rol: string;
    descripcion_rol?: string | null;
    permisos: Permiso[];
}

export type RolPayload = {
    nombre_rol: string;
    descripcion_rol?: string;
    permisos_ids: number[];
}

export type RolFormData = {
    nombre_rol: string;
    descripcion_rol: string;
    permisos_ids: string[];
};
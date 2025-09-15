// src/features/usuarios/types/index.ts

import type { Area } from '../../areas/types';
import type { Rol } from '../../roles/types';

// Representa el objeto Usuario completo que recibimos de la API
export interface Usuario {
    id_usuario: number;
    nombre_completo: string;
    email: string;
    telefono?: string | null;
    activo: boolean;
    area: Area; // Objeto anidado
    roles: Rol[]; // Array de objetos anidados
    jefe_directo?: { // Objeto simple para el jefe
        id_usuario: number;
        nombre_completo: string;
    } | null;
}

// Payload para CREAR un usuario. Incluye la contraseña.
export type UsuarioPayload = {
    nombre_completo: string;
    email: string;
    telefono?: string;
    password?: string;
    id_area: number;
    roles_ids: number[];
    id_jefe_directo?: number | null;
};

// Datos que maneja el formulario. La contraseña es opcional y los IDs son strings.
export type UsuarioFormData = {
    nombre_completo: string;
    email: string;
    telefono: string;
    password?: string;
    id_area: string | null; // El <Select> de Mantine trabaja mejor con strings o null
    roles_ids: string[]; // El <MultiSelect> trabaja con strings
    id_jefe_directo: string | null;
};
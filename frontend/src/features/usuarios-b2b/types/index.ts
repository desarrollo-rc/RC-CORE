// frontend/src/features/usuarios-b2b/types/index.ts

// Cliente (simplificado)
export interface Cliente {
    id_cliente: number;
    nombre_cliente: string;
    rut_cliente: string;
}

// Usuario B2B completo
export interface UsuarioB2B {
    id_usuario_b2b: number;
    nombre_completo: string;
    usuario: string;
    email: string;
    id_cliente: number;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion?: string;
    cliente?: Cliente;
}

// Payload para crear usuario B2B
export interface CrearUsuarioB2BPayload {
    nombre_completo: string;
    usuario: string;
    email: string;
    password: string;
    id_cliente: number;
}

// Payload para actualizar usuario B2B
export interface ActualizarUsuarioB2BPayload {
    nombre_completo?: string;
    usuario?: string;
    email?: string;
    id_cliente?: number;
}

// Filtros para la búsqueda de usuarios B2B
export type UsuarioB2BFilters = {
    page?: number;
    per_page?: number;
    usuario?: string;
    nombre_completo?: string;
    id_cliente?: number;
    activo?: boolean;
};

// Respuesta paginada de usuarios B2B
export interface PaginatedUsuariosB2BResponse {
    usuarios: UsuarioB2B[];
    pagination: {
        page: number;
        pages: number;
        per_page: number;
        total: number;
    };
}


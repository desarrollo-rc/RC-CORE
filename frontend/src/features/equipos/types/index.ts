// frontend/src/features/equipos/types/index.ts

// Estados de alta de equipo
export type EstadoAltaEquipo = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

// Usuario B2B (simplificado)
export interface UsuarioB2B {
    id_usuario_b2b: number;
    nombre_completo: string;
    usuario: string;
    email: string;
}

// Equipo completo
export interface Equipo {
    id_equipo: number;
    id_usuario_b2b: number;
    nombre_equipo: string;
    mac_address: string;
    procesador: string;
    placa_madre: string;
    disco_duro: string;
    estado_alta: EstadoAltaEquipo;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion?: string;
    usuario_b2b?: UsuarioB2B;
}

// Payload para crear equipo
export interface CrearEquipoPayload {
    id_usuario_b2b: number;
    nombre_equipo: string;
    mac_address: string;
    procesador: string;
    placa_madre: string;
    disco_duro: string;
    estado_alta: EstadoAltaEquipo;
}

// Payload para actualizar equipo
export interface ActualizarEquipoPayload {
    nombre_equipo?: string;
    mac_address?: string;
    procesador?: string;
    placa_madre?: string;
    disco_duro?: string;
    estado_alta?: EstadoAltaEquipo;
}

// Filtros para la búsqueda de equipos
export type EquipoFilters = {
    page?: number;
    per_page?: number;
    nombre_equipo?: string;
    id_usuario_b2b?: number;
    activo?: boolean;
    estado_alta?: EstadoAltaEquipo;
};

// Respuesta paginada de equipos
export interface PaginatedEquiposResponse {
    equipos: Equipo[];
    pagination: {
        page: number;
        pages: number;
        per_page: number;
        total: number;
    };
}


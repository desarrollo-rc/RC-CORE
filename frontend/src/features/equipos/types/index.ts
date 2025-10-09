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


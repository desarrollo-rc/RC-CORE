// frontend/src/features/casos/types/index.ts

// Estados de caso según el backend
export type EstadoCaso = 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado';

// Prioridades de caso según el backend
export type PrioridadCaso = 'Baja' | 'Media' | 'Alta' | 'Urgente';

// Tipo de Caso
export interface TipoCaso {
    id_tipo_caso: number;
    nombre_tipo: string;
    descripcion?: string;
    activo: boolean;
}

// Cliente (simplificado)
export interface Cliente {
    id_cliente: number;
    nombre_cliente: string;
    rut_cliente: string;
}

// Usuario (simplificado)
export interface Usuario {
    id_usuario: number;
    nombre_completo: string;
    email: string;
}

// Caso completo
export interface Caso {
    id_caso: number;
    titulo: string;
    descripcion: string;
    estado: EstadoCaso;
    prioridad: PrioridadCaso;
    fecha_creacion: string;
    fecha_cierre: string | null;
    id_cliente: number;
    id_usuario_creacion: number;
    id_usuario_asignado: number | null;
    id_tipo_caso: number;
    cliente?: Cliente;
    creador?: Usuario;
    asignado?: Usuario;
    tipo_caso?: TipoCaso;
}

// Payload para crear caso
export interface CrearCasoPayload {
    titulo: string;
    descripcion: string;
    estado: EstadoCaso;
    prioridad: PrioridadCaso;
    id_cliente: number;
    id_tipo_caso: number;
    id_usuario_asignado?: number;
}

// Payload para actualizar caso
export interface ActualizarCasoPayload {
    titulo?: string;
    descripcion?: string;
    estado?: EstadoCaso;
    prioridad?: PrioridadCaso;
    id_usuario_asignado?: number;
}


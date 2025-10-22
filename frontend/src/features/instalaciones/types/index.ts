// Estados de instalación según el backend
export type EstadoInstalacion = 
    | 'Pendiente Aprobación' 
    | 'Pendiente Instalación'
    | 'Usuario Creado'
    | 'Configuración Pendiente'
    | 'Agendada' 
    | 'Completada' 
    | 'Cancelada';

export interface UsuarioB2B {
    id_usuario_b2b: number;
    nombre_completo: string;
    usuario: string;
    email: string;
    id_cliente: number;
    activo: boolean;
    fecha_creacion: string;
    cliente?: {
        id_cliente: number;
        nombre_cliente: string;
        codigo_cliente: string;
        vendedor?: {
            id_vendedor: number;
            usuario?: {
                nombre_completo: string;
            };
        };
    };
}

export interface Caso {
    id_caso: number;
    titulo: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    fecha_creacion: string;
    cliente?: {
        id_cliente: number;
        nombre_cliente: string;
        codigo_cliente: string;
        vendedor?: {
            id_vendedor: number;
            usuario?: {
                nombre_completo: string;
            };
        };
    };
}

export interface Instalacion {
    id_instalacion: number;
    id_caso: number;
    id_usuario_b2b: number;
    id_equipo: number | null;
    fecha_solicitud: string;
    fecha_aprobacion: string | null;
    fecha_creacion_usuario: string | null;
    fecha_instalacion: string | null;
    fecha_capacitacion: string | null;
    fecha_finalizacion: string | null;
    id_usuario_asignado: number | null;
    estado: EstadoInstalacion;
    observaciones: string | null;
    caso?: Caso;
    usuario_b2b?: UsuarioB2B;
}

export interface NuevaInstalacion {
    id_caso: number;
    id_usuario_b2b: number;
    fecha_visita?: string;
    observaciones?: string;
}

// Nueva interfaz para crear instalación completa con caso automático
export interface CrearInstalacionCompletaPayload {
    id_cliente: number;
    id_usuario_b2b?: number; // Opcional si es usuario nuevo
    es_cliente_nuevo: boolean;
    es_primer_usuario: boolean;
    es_cambio_equipo: boolean;
    es_usuario_adicional?: boolean; // Para usuarios adicionales
    numero_usuarios?: number; // Para cliente nuevo, cantidad de usuarios a crear
    observaciones?: string;
    fecha_solicitud?: string; // Fecha y hora de solicitud personalizada
    datos_usuario_adicional?: {
        nombre_completo: string;
        usuario: string;
        email: string;
        password: string;
    };
}

export interface ActualizarInstalacion {
    fecha_visita?: string;
    fecha_instalacion?: string;
    estado?: EstadoInstalacion;
    observaciones?: string;
}

// Payloads para acciones específicas
export interface AprobarInstalacionPayload {
    fecha_aprobacion_personalizada?: string; // Fecha ISO personalizada para aprobación
    observaciones?: string;
}

export interface CrearUsuarioB2BPayload {
    nombre_completo: string;
    usuario: string;
    email: string;
    password?: string; // Opcional, se genera automático en backend
    id_usuario_b2b?: number; // Solo si existe_en_sistema=true
    existe_en_sistema?: boolean;
    existe_en_corp?: boolean;
    fecha_creacion_personalizada?: string; // Fecha ISO personalizada para creación de usuario
}

export interface AgendarInstalacionPayload {
    fecha_visita?: string;
    fecha_agendamiento_personalizada?: string; // Fecha ISO personalizada para agendamiento
}

export interface RealizarInstalacionPayload {
    fecha_instalacion?: string;
    fecha_instalacion_personalizada?: string; // Fecha ISO personalizada para instalación
    observaciones?: string;
}

export interface FinalizarInstalacionPayload {
    fecha_finalizacion?: string;
    fecha_finalizacion_personalizada?: string; // Fecha ISO personalizada para finalización
    fecha_capacitacion?: string;
    requiere_capacitacion: boolean;
    observaciones?: string;
}

// Respuesta para creación múltiple de instalaciones
export interface CrearInstalacionCompletaResponse {
    casos: any[];
    instalaciones: Instalacion[];
    total_instalaciones: number;
}

// Filtros para instalaciones
export interface InstalacionFilters {
    page?: number;
    per_page?: number;
    tipo_caso_id?: number;
    usuario_b2b_id?: number;
    id_cliente?: number;
    id_vendedor?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
}

// Respuesta paginada de instalaciones
export interface PaginatedInstalacionesResponse {
    instalaciones: Instalacion[];
    pagination: {
        page: number;
        pages: number;
        per_page: number;
        total: number;
    };
}
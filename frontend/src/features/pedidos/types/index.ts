// frontend/src/features/pedidos/types/index.ts

// --- Tipos para las entidades anidadas que vienen en la respuesta ---

export interface Estado {
    codigo_estado: string;
    nombre_estado: string;
}

export interface EstadoLogistico {
    id_estado: number;
    nombre_estado: string;
    codigo_estado: string;
}

export interface ClienteSimple {
    id_cliente: number;
    codigo_cliente: string;
    nombre_cliente: string;
}

export interface ProductoDetalle {
    producto_sku: string;
    producto_nombre: string;
}

export interface HistorialEstado {
    fecha_evento: string;
    estado_anterior: string | null;
    estado_nuevo: string;
    tipo_estado: 'GENERAL' | 'CREDITO' | 'LOGISTICO';
    observaciones: string;
    usuario_responsable: {
        nombre_completo: string;
    } | null;
}

export interface PedidoDetalle {
    id_producto: number;
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
    producto: ProductoDetalle;
    cantidad_enviada: number | null;
    cantidad_recibida: number | null;
    observacion_linea: string | null;
}

// --- Interfaz principal del Pedido (lo que recibimos de la API) ---

export interface Pedido {
    id_pedido: number;
    codigo_pedido_origen: string | null;
    numero_pedido_sap: string | null;
    numero_factura_sap: string | null;

    cliente: ClienteSimple;

    estado_general: Estado;
    estado_credito: Estado;
    estado_logistico: EstadoLogistico | null;

    monto_neto: string;
    monto_impuestos: string;
    monto_total: string;

    fecha_creacion: string;
    fecha_modificacion: string | null;

    factura_manual: boolean | null;
    fecha_facturacion: string | null;

    detalles: PedidoDetalle[];
    historial_estados: HistorialEstado[];
}

// --- Tipos para la comunicación con la API ---

export interface PedidoList {
    id_pedido: number;
    codigo_pedido_origen: string | null;
    cliente_nombre: string;
    fecha_creacion: string;
    monto_total: string;
    estado_general: {
        nombre_estado: string;
    };
}

export interface PaginatedPedidosResponse {
    pedidos: PedidoList[]; // Usamos el nuevo tipo aquí
    pagination: {
        total: number;
        pages: number;
        page: number;
        per_page: number;
    };
}

export type PedidoPayload = {
    codigo_pedido_origen?: string;
    id_cliente: number;
    id_canal_venta: number;
    id_vendedor?: number;
    id_usuario_b2b?: number;
    fecha_evento: string;
    detalles: {
        id_producto: number;
        cantidad: number;
        precio_unitario: number;
    }[];
    aprobacion_automatica?: boolean;
    numero_pedido_sap?: string; // requerido si aprobacion_automatica es true
};

export type PedidoUpdateEstadoPayload = {
    id_estado_general?: number;
    id_estado_credito?: number;
    id_estado_logistico?: number;
    observaciones: string;
    fecha_evento: string;
    numero_pedido_sap?: string; // requerido cuando se aprueba crédito
}

export type PedidoFilters = {
    page?: number;
    per_page?: number;
    cliente_id?: number;
    vendedor_id?: number;
    estado_id?: number;
    codigo_b2b?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
};
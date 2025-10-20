// frontend/src/features/pedidos/services/pedidoService.ts
import apiClient from '../../../api/axios';
import type { Pedido, PedidoPayload, PedidoFilters, PaginatedPedidosResponse, PedidoUpdateEstadoPayload, EstadoOption } from '../types';

export const getPedidos = async (filters: PedidoFilters): Promise<PaginatedPedidosResponse> => {
    const response = await apiClient.get<PaginatedPedidosResponse>('/pedidos', { params: filters });
    return response.data;
};

export const getPedidoById = async (id: number): Promise<Pedido> => {
    const response = await apiClient.get<Pedido>(`/pedidos/${id}`);
    return response.data;
};

export const createPedido = async (data: PedidoPayload): Promise<Pedido> => {
    const response = await apiClient.post<Pedido>('/pedidos', data);
    return response.data;
};

export const updatePedidoEstado = async (id: number, data: PedidoUpdateEstadoPayload): Promise<Pedido> => {
    // Usamos el endpoint PUT que ya definimos en el backend
    const response = await apiClient.put<Pedido>(`/pedidos/${id}/estado`, data);
    return response.data;
};

export const marcarFacturado = async (
    pedidoId: number,
    data: { factura_manual: boolean; numero_factura_sap?: string; fecha_facturacion?: string; observaciones?: string }
): Promise<Pedido> => {
    const response = await apiClient.put<Pedido>(`/pedidos/${pedidoId}/marcar-facturado`, data);
    return response.data;
};

export const marcarEntregado = async (
    pedidoId: number,
    data: { fecha_evento: string; observaciones?: string }
): Promise<Pedido> => {
    const response = await apiClient.put<Pedido>(`/pedidos/${pedidoId}/marcar-entregado`, data);
    return response.data;
};

export const updateEstadoLogistico = async (
    pedidoId: number,
    payload: { id_estado_logistico: number; fecha_evento: string; observaciones?: string }
): Promise<Pedido> => {
    const response = await apiClient.put<Pedido>(`/pedidos/${pedidoId}/estado`, payload);
    return response.data;
};

export const exportPedidosCutoff = async (fecha: string, cutoffHour: number): Promise<Blob> => {
    const response = await apiClient.get(`/pedidos/export`, {
        params: { fecha, cutoff_hour: cutoffHour },
        responseType: 'blob'
    });
    return response.data;
};

export interface GmailExtractionResult {
    exito: boolean;
    mensaje: string;
    pedidos_procesados: Array<{
        codigo_b2b: string;
        id_pedido?: number;
        mensaje: string;
        productos_count: number;
    }>;
    errores: Array<{
        codigo_b2b?: string;
        mensaje: string;
    }>;
}

export interface ProductoPreview {
    sku: string;
    nombre_producto: string;
    cantidad: number;
    valor_unitario: number;
    existe: boolean;
    id_producto: number | null;
}

export interface PedidoPreview {
    codigo_b2b: string;
    codigo_b2b_alternativo?: string;
    es_duplicado_diferente?: boolean;
    fecha_pedido: string;
    aprobacion_automatica?: boolean;
    numero_pedido_sap?: string | null;
    ruta_pdf?: string | null;
    info_cliente: {
        rut: string;
        razon_social: string;
        direccion: string;
        comuna: string;
        tipo_despacho: string;
        transporte: string;
    };
    cliente_existe: boolean;
    id_cliente: number | null;
    productos: ProductoPreview[];
    advertencias: string[];
    estado_validacion: 'valido' | 'advertencia' | 'error' | 'cargado';
    seleccionado: boolean;
}

export interface GmailPreviewResult {
    exito: boolean;
    mensaje: string;
    pedidos: PedidoPreview[];
    errores: Array<{
        codigo_b2b?: string;
        mensaje: string;
    }>;
}

export interface GmailProcessResult {
    exito: boolean;
    mensaje: string;
    pedidos_creados: Array<{
        codigo_b2b: string;
        codigo_b2b_final?: string;
        id_pedido: number;
        mensaje: string;
        productos_count: number;
        es_duplicado_diferente?: boolean;
    }>;
    clientes_creados: Array<{
        rut: string;
        nombre: string;
        id_cliente: number;
    }>;
    productos_creados: Array<{
        sku: string;
        nombre: string;
        id_producto: number;
    }>;
    errores: Array<{
        codigo_b2b: string;
        mensaje: string;
    }>;
}

export const extraerPedidosGmail = async (
    fechaDesde?: string,
    fechaHasta?: string
): Promise<GmailExtractionResult> => {
    const response = await apiClient.post<GmailExtractionResult>('/pedidos/gmail/extraer', {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
    });
    return response.data;
};

export const previewPedidosGmail = async (
    fechaDesde?: string,
    fechaHasta?: string
): Promise<GmailPreviewResult> => {
    const response = await apiClient.post<GmailPreviewResult>('/pedidos/gmail/preview', {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
    });
    return response.data;
};

export const procesarPedidosGmail = async (
    pedidos: PedidoPreview[],
    crearClientes: boolean = true,
    crearProductos: boolean = true
): Promise<GmailProcessResult> => {
    const response = await apiClient.post<GmailProcessResult>('/pedidos/gmail/procesar', {
        pedidos,
        crear_clientes: crearClientes,
        crear_productos: crearProductos
    });
    return response.data;
};

export const generarInformeCorte = async (
    fecha: string,
    hora: number
): Promise<Blob> => {
    const response = await apiClient.get('/pedidos/informes/corte', {
        params: { fecha, hora },
        responseType: 'blob'
    });
    return response.data;
};

export const generarInformeMensual = async (
    mes: string,
    año: string
): Promise<Blob> => {
    const response = await apiClient.get('/pedidos/informes/mensual', {
        params: { mes, ano: año },
        responseType: 'blob'
    });
    return response.data;
};

export const generarInformeCorteExcel = async (
    fecha: string,
    hora: number
): Promise<Blob> => {
    const response = await apiClient.get('/pedidos/informes/corte/excel', {
        params: { fecha, hora },
        responseType: 'blob'
    });
    return response.data;
};

export const generarInformeMensualExcel = async (
    mes: string,
    año: string
): Promise<Blob> => {
    const response = await apiClient.get('/pedidos/informes/mensual/excel', {
        params: { mes, ano: año },
        responseType: 'blob'
    });
    return response.data;
};

// --- Servicios para obtener listas de estados ---

export const getEstadosGenerales = async (): Promise<EstadoOption[]> => {
    const response = await apiClient.get<EstadoOption[]>('/pedidos/estados/generales');
    return response.data;
};

export const getEstadosCredito = async (): Promise<EstadoOption[]> => {
    const response = await apiClient.get<EstadoOption[]>('/pedidos/estados/credito');
    return response.data;
};

export const getEstadosLogisticos = async (): Promise<EstadoOption[]> => {
    const response = await apiClient.get<EstadoOption[]>('/pedidos/estados/logisticos');
    return response.data;
};
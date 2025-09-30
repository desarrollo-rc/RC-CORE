// frontend/src/features/pedidos/services/pedidoService.ts
import apiClient from '../../../api/axios';
import type { Pedido, PedidoPayload, PedidoFilters, PaginatedPedidosResponse, PedidoUpdateEstadoPayload } from '../types';

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
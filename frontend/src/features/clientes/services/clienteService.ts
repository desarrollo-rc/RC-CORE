// frontend/src/features/clientes/services/clienteService.ts
import apiClient from '../../../api/axios';
import type { Cliente, ClientePayload } from '../types';

// La API de clientes podría devolver paginación en el futuro
interface PaginatedResponse {
    clientes: Cliente[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        pages: number;
    }
}

export const getClientes = async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/clientes');
    return response.data;
};

export const createCliente = async (data: ClientePayload): Promise<Cliente> => {
    const response = await apiClient.post<Cliente>('/clientes', data);
    return response.data;
};

export const updateCliente = async (id: number, data: Partial<ClientePayload>): Promise<Cliente> => {
    const response = await apiClient.put<Cliente>(`/clientes/${id}`, data);
    return response.data;
};

export const deactivateCliente = async (id: number, motivo_bloqueo: string): Promise<Cliente> => {
    const response = await apiClient.put<Cliente>(`/clientes/${id}/deactivate`, { motivo_bloqueo });
    return response.data;
};

export const activateCliente = async (id: number): Promise<Cliente> => {
    const response = await apiClient.put<Cliente>(`/clientes/${id}/activate`);
    return response.data;
};
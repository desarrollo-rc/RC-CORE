// frontend/src/features/clientes/services/clienteService.ts
import apiClient from '../../../api/axios';
import type { Cliente, ClientePayload, ClienteFilters } from '../types';

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

export const getClientes = async (filters?: ClienteFilters): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/clientes', { params: filters });
    return response.data;
};

export const fetchAllClientes = async (): Promise<Cliente[]> => {
    // Intenta traer todas las páginas de clientes para usarlas en selects
    const first = await getClientes({ page: 1, per_page: 50 });
    let all: Cliente[] = [...first.clientes];
    const totalPages = first.pagination?.pages ?? 1;
    for (let p = 2; p <= totalPages; p++) {
        const resp = await getClientes({ page: p, per_page: 50 });
        all = all.concat(resp.clientes);
    }
    return all;
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
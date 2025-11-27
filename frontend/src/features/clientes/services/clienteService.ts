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

export const fetchAllClientes = async (includeInactivos: boolean = false): Promise<Cliente[]> => {
    // Intenta traer todas las páginas de clientes para usarlas en selects
    // Si includeInactivos es true, trae activos e inactivos (pasando activo: undefined para que el backend traiga todos)
    // Si es false, solo trae activos (comportamiento por defecto del backend)
    const filters: ClienteFilters = { page: 1, per_page: 50 };
    if (includeInactivos) {
        // Para traer todos, necesitamos hacer dos llamadas: activos e inactivos
        // O mejor, modificar el backend para aceptar un parámetro especial
        // Por ahora, haremos dos llamadas y las combinaremos
        const [activosResp, inactivosResp] = await Promise.all([
            getClientes({ ...filters, activo: true }),
            getClientes({ ...filters, activo: false })
        ]);
        
        let all: Cliente[] = [...activosResp.clientes, ...inactivosResp.clientes];
        
        // Obtener todas las páginas de activos
        const totalPagesActivos = activosResp.pagination?.pages ?? 1;
        for (let p = 2; p <= totalPagesActivos; p++) {
            const resp = await getClientes({ page: p, per_page: 50, activo: true });
            all = all.concat(resp.clientes);
        }
        
        // Obtener todas las páginas de inactivos
        const totalPagesInactivos = inactivosResp.pagination?.pages ?? 1;
        for (let p = 2; p <= totalPagesInactivos; p++) {
            const resp = await getClientes({ page: p, per_page: 50, activo: false });
            all = all.concat(resp.clientes);
        }
        
        return all;
    } else {
        // Solo activos (comportamiento original)
        const first = await getClientes(filters);
        let all: Cliente[] = [...first.clientes];
        const totalPages = first.pagination?.pages ?? 1;
        for (let p = 2; p <= totalPages; p++) {
            const resp = await getClientes({ page: p, per_page: 50 });
            all = all.concat(resp.clientes);
        }
        return all;
    }
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
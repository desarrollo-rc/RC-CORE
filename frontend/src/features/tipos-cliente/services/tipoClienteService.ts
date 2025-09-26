// frontend/src/features/tipos-cliente/services/tipoClienteService.ts
import apiClient from '../../../api/axios';
import type { TipoCliente, TipoClientePayload } from '../types';

export const getTiposCliente = async (includeInactive: boolean = false): Promise<TipoCliente[]> => {
    const response = await apiClient.get<TipoCliente[]>('/tipos-cliente', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createTipoCliente = async (data: TipoClientePayload): Promise<TipoCliente> => {
    const response = await apiClient.post<TipoCliente>('/tipos-cliente', data);
    return response.data;
};

export const updateTipoCliente = async (id: number, data: Partial<TipoClientePayload>): Promise<TipoCliente> => {
    const response = await apiClient.put<TipoCliente>(`/tipos-cliente/${id}`, data);
    return response.data;
};

export const deactivateTipoCliente = async (id: number): Promise<TipoCliente> => {
    const response = await apiClient.put<TipoCliente>(`/tipos-cliente/${id}/deactivate`);
    return response.data;
};

export const activateTipoCliente = async (id: number): Promise<TipoCliente> => {
    const response = await apiClient.put<TipoCliente>(`/tipos-cliente/${id}/activate`);
    return response.data;
};
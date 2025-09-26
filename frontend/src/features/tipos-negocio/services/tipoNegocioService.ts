// frontend/src/features/tipos-negocio/services/tipoNegocioService.ts
import apiClient from '../../../api/axios';
import type { TipoNegocio, TipoNegocioPayload } from '../types';

export const getTiposNegocio = async (includeInactive: boolean = false): Promise<TipoNegocio[]> => {
    const response = await apiClient.get<TipoNegocio[]>('/tipos-negocio', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createTipoNegocio = async (data: TipoNegocioPayload): Promise<TipoNegocio> => {
    const response = await apiClient.post<TipoNegocio>('/tipos-negocio', data);
    return response.data;
};

export const updateTipoNegocio = async (id: number, data: Partial<TipoNegocioPayload>): Promise<TipoNegocio> => {
    const response = await apiClient.put<TipoNegocio>(`/tipos-negocio/${id}`, data);
    return response.data;
};

export const deactivateTipoNegocio = async (id: number): Promise<TipoNegocio> => {
    const response = await apiClient.put<TipoNegocio>(`/tipos-negocio/${id}/deactivate`);
    return response.data;
};

export const activateTipoNegocio = async (id: number): Promise<TipoNegocio> => {
    const response = await apiClient.put<TipoNegocio>(`/tipos-negocio/${id}/activate`);
    return response.data;
};
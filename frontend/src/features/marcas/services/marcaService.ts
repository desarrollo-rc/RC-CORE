// frontend/src/features/marcas/services/marcaService.ts

import apiClient from '../../../api/axios';
import type { Marca, MarcaPayload } from '../types';

export const getMarcas = async (includeInactive: boolean = false): Promise<Marca[]> => {
    const response = await apiClient.get<Marca[]>('/marcas', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createMarca = async (data: MarcaPayload): Promise<Marca> => {
    const response = await apiClient.post<Marca>('/marcas', data);
    return response.data;
};

export const updateMarca = async (id: number, data: Partial<MarcaPayload>): Promise<Marca> => {
    const response = await apiClient.put<Marca>(`/marcas/${id}`, data);
    return response.data;
};

export const deactivateMarca = async (id: number): Promise<Marca> => {
    const response = await apiClient.put<Marca>(`/marcas/${id}/deactivate`);
    return response.data;
};

export const activateMarca = async (id: number): Promise<Marca> => {
    const response = await apiClient.put<Marca>(`/marcas/${id}/activate`);
    return response.data;
};
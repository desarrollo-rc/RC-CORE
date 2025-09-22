// frontend/src/features/fabricas/services/fabricaService.ts

import apiClient from '../../../api/axios';
import type { Fabrica, FabricaPayload } from '../types';

export const getFabricas = async (includeInactive: boolean = false): Promise<Fabrica[]> => {
    const response = await apiClient.get<Fabrica[]>('/fabricas', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const getFabricaById = async (id: number): Promise<Fabrica> => {
    const response = await apiClient.get<Fabrica>(`/fabricas/${id}`);
    return response.data;
};

export const createFabrica = async (data: FabricaPayload): Promise<Fabrica> => {
    const response = await apiClient.post<Fabrica>('/fabricas', data);
    return response.data;
};

export const updateFabrica = async (id: number, data: Partial<FabricaPayload>): Promise<Fabrica> => {
    const response = await apiClient.put<Fabrica>(`/fabricas/${id}`, data);
    return response.data;
};

export const deactivateFabrica = async (id: number): Promise<Fabrica> => {
    const response = await apiClient.put<Fabrica>(`/fabricas/${id}/deactivate`);
    return response.data;
};

export const activateFabrica = async (id: number): Promise<Fabrica> => {
    const response = await apiClient.put<Fabrica>(`/fabricas/${id}/activate`);
    return response.data;
};
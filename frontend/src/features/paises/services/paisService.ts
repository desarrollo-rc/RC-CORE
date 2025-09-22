// frontend/src/features/paises/services/paisService.ts

import apiClient from '../../../api/axios';
import type { Pais, PaisPayload } from '../types';

export const getPaises = async (): Promise<Pais[]> => {
    const response = await apiClient.get<Pais[]>('/paises');
    return response.data;
};

export const createPais = async (data: PaisPayload): Promise<Pais> => {
    const response = await apiClient.post<Pais>('/paises', data);
    return response.data;
};

export const updatePais = async (id: number, data: Partial<PaisPayload>): Promise<Pais> => {
    const response = await apiClient.put<Pais>(`/paises/${id}`, data);
    return response.data;
};

export const deletePais = async (id: number): Promise<void> => {
    await apiClient.delete(`/paises/${id}`);
};
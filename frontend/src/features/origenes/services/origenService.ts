// frontend/src/features/origenes/services/origenService.ts

import apiClient from '../../../api/axios';
import type { Origen, OrigenPayload } from '../types';

export const getOrigenes = async (): Promise<Origen[]> => {
    const response = await apiClient.get<Origen[]>('/origenes');
    return response.data;
};

export const createOrigen = async (data: OrigenPayload): Promise<Origen> => {
    const response = await apiClient.post<Origen>('/origenes', data);
    return response.data;
};

export const deleteOrigen = async (id: number): Promise<void> => {
    await apiClient.delete(`/origenes/${id}`);
};
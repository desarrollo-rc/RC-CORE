// frontend/src/features/calidades/services/calidadService.ts
import apiClient from '../../../api/axios';
import type { Calidad, CalidadPayload } from '../types';

export const getCalidades = async (includeInactive: boolean = false): Promise<Calidad[]> => {
    const response = await apiClient.get<Calidad[]>('/calidades', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createCalidad = async (data: CalidadPayload): Promise<Calidad> => {
    const response = await apiClient.post<Calidad>('/calidades', data);
    return response.data;
};

export const updateCalidad = async (id: number, data: Partial<CalidadPayload>): Promise<Calidad> => {
    const response = await apiClient.put<Calidad>(`/calidades/${id}`, data);
    return response.data;
};

export const deactivateCalidad = async (id: number): Promise<Calidad> => {
    const response = await apiClient.put<Calidad>(`/calidades/${id}/deactivate`);
    return response.data;
};

export const activateCalidad = async (id: number): Promise<Calidad> => {
    const response = await apiClient.put<Calidad>(`/calidades/${id}/activate`);
    return response.data;
};
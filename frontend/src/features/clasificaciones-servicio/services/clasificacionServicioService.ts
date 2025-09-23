// frontend/src/features/clasificaciones-servicio/services/clasificacionServicioService.ts

import apiClient from '../../../api/axios';
import type { ClasificacionServicio, ClasificacionServicioPayload } from '../types';

export const getClasificacionesServicio = async (includeInactive: boolean = false): Promise<ClasificacionServicio[]> => {
    const response = await apiClient.get<ClasificacionServicio[]>('/clasificaciones-servicio', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createClasificacionServicio = async (data: ClasificacionServicioPayload): Promise<ClasificacionServicio> => {
    const response = await apiClient.post<ClasificacionServicio>('/clasificaciones-servicio', data);
    return response.data;
};

export const updateClasificacionServicio = async (id: number, data: Partial<ClasificacionServicioPayload>): Promise<ClasificacionServicio> => {
    const response = await apiClient.put<ClasificacionServicio>(`/clasificaciones-servicio/${id}`, data);
    return response.data;
};

export const deactivateClasificacionServicio = async (id: number): Promise<ClasificacionServicio> => {
    const response = await apiClient.put<ClasificacionServicio>(`/clasificaciones-servicio/${id}/deactivate`);
    return response.data;
};

export const activateClasificacionServicio = async (id: number): Promise<ClasificacionServicio> => {
    const response = await apiClient.put<ClasificacionServicio>(`/clasificaciones-servicio/${id}/activate`);
    return response.data;
};
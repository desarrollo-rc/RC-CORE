// frontend/src/features/clasificaciones-estadistica/services/clasificacionEstadisticaService.ts

import apiClient from '../../../api/axios';
import type { ClasificacionEstadistica, ClasificacionEstadisticaPayload } from '../types';

export const getClasificacionesEstadistica = async (includeInactive: boolean = false): Promise<ClasificacionEstadistica[]> => {
    const response = await apiClient.get<ClasificacionEstadistica[]>('/clasificaciones-estadistica', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createClasificacionEstadistica = async (data: ClasificacionEstadisticaPayload): Promise<ClasificacionEstadistica> => {
    const response = await apiClient.post<ClasificacionEstadistica>('/clasificaciones-estadistica', data);
    return response.data;
};

export const updateClasificacionEstadistica = async (id: number, data: Partial<ClasificacionEstadisticaPayload>): Promise<ClasificacionEstadistica> => {
    const response = await apiClient.put<ClasificacionEstadistica>(`/clasificaciones-estadistica/${id}`, data);
    return response.data;
};

export const deactivateClasificacionEstadistica = async (id: number): Promise<ClasificacionEstadistica> => {
    const response = await apiClient.put<ClasificacionEstadistica>(`/clasificaciones-estadistica/${id}/deactivate`);
    return response.data;
};

export const activateClasificacionEstadistica = async (id: number): Promise<ClasificacionEstadistica> => {
    const response = await apiClient.put<ClasificacionEstadistica>(`/clasificaciones-estadistica/${id}/activate`);
    return response.data;
};
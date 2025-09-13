// src/features/areas/services/areaService.ts

import apiClient from '../../../api/axios';
import type {Area, AreaPayload} from '../types';

export const getAreas = async (includeInactive: boolean = false): Promise<Area[]> => {
    try {
        const response = await apiClient.get<Area[]>('/areas', {
            params: { incluir_inactivos: includeInactive }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener las áreas:', error);
        throw error;
    }
};

export const getAreaById = async (areaId: number): Promise<Area> => {
    try {
        const response = await apiClient.get<Area>(`/areas/${areaId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener el área:', error);
        throw error;
    }
};

export const createArea = async (area: AreaPayload): Promise<Area> => {
    try {
        const response = await apiClient.post<Area>('/areas', area);
        return response.data;
    } catch (error) {
        console.error('Error al crear el área:', error);
        throw error;
    }
};

export const updateArea = async (areaId: number, area: AreaPayload): Promise<Area> => {
    try {
        const response = await apiClient.put<Area>(`/areas/${areaId}`, area);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar el área:', error);
        throw error;
    }
};

export const deactivateArea = async (areaId: number): Promise<Area> => {
    try {
        const response = await apiClient.put<Area>(`/areas/${areaId}/deactivate`);
        return response.data;
    } catch (error) {
        console.error('Error al desactivar el área:', error);
        throw error;
    }
};

export const activateArea = async (areaId: number): Promise<Area> => {
    try {
        const response = await apiClient.put<Area>(`/areas/${areaId}/activate`);
        return response.data;
    } catch (error) {
        console.error('Error al activar el área:', error);
        throw error;
    }
};
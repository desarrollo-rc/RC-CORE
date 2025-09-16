// src/features/productos/divisiones/services/divisionService.ts

import apiClient from '../../../api/axios';
import type { Division, DivisionPayload } from '../types';

export const getDivisiones = async (includeInactive: boolean = false): Promise<Division[]> => {
    try {
        const response = await apiClient.get<Division[]>('/divisiones', {
            params: { incluir_inactivos: includeInactive }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener las divisiones:', error);
        throw error;
    }
};

export const createDivision = async (data: DivisionPayload): Promise<Division> => {
    try {
        const response = await apiClient.post<Division>('/divisiones', data);
        return response.data;
    } catch (error) {
        console.error('Error al crear la división:', error);
        throw error;
    }
};

export const updateDivision = async (id: number, data: Partial<DivisionPayload>): Promise<Division> => {
    try {
        const response = await apiClient.put<Division>(`/divisiones/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar la división ${id}:`, error);
        throw error;
    }
};

export const deactivateDivision = async (id: number): Promise<Division> => {
    try {
        const response = await apiClient.put<Division>(`/divisiones/${id}/deactivate`);
        return response.data;
    } catch (error) {
        console.error(`Error al desactivar la división ${id}:`, error);
        throw error;
    }
};

export const activateDivision = async (id: number): Promise<Division> => {
    try {
        const response = await apiClient.put<Division>(`/divisiones/${id}/activate`);
        return response.data;
    } catch (error) {
        console.error(`Error al activar la división ${id}:`, error);
        throw error;
    }
};
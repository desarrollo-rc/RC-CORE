// src/features/productos/medidas/services/medidaService.ts

import apiClient from '../../../api/axios';
import type { Medida, MedidaPayload } from '../types';

export const getMedidas = async (includeInactive: boolean = false): Promise<Medida[]> => {
    try {
        const response = await apiClient.get<Medida[]>('/medidas', {
            params: { incluir_inactivos: includeInactive }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener las medidas:', error);
        throw error;
    }
};

export const createMedida = async (data: MedidaPayload): Promise<Medida> => {
    try {
        const response = await apiClient.post<Medida>('/medidas', data);
        return response.data;
    } catch (error) {
        console.error('Error al crear la medida:', error);
        throw error;
    }
};

export const updateMedida = async (id: number, data: Partial<MedidaPayload>): Promise<Medida> => {
    try {
        const response = await apiClient.put<Medida>(`/medidas/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar la medida ${id}:`, error);
        throw error;
    }
};

export const deactivateMedida = async (id: number): Promise<Medida> => {
    try {
        const response = await apiClient.put<Medida>(`/medidas/${id}/deactivate`);
        return response.data;
    } catch (error) {
        console.error(`Error al desactivar la medida ${id}:`, error);
        throw error;
    }
};

export const activateMedida = async (id: number): Promise<Medida> => {
    try {
        const response = await apiClient.put<Medida>(`/medidas/${id}/activate`);
        return response.data;
    } catch (error) {
        console.error(`Error al activar la medida ${id}:`, error);
        throw error;
    }
};
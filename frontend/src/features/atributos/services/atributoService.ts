// src/features/productos/atributos/services/atributoService.ts

import apiClient from '../../../api/axios';
import type { Atributo, AtributoPayload } from '../types'

export const getAtributos = async (includeInactive: boolean = false): Promise<Atributo[]> => {
    try {
        const response = await apiClient.get<Atributo[]>('/atributos', {
            params: { incluir_inactivos: includeInactive }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los atributos:', error);
        throw error;
    }
};

export const createAtributo = async (data: AtributoPayload): Promise<Atributo> => {
    try {
        const response = await apiClient.post<Atributo>('/atributos', data);
        return response.data;
    } catch (error) {
        console.error('Error al crear el atributo:', error);
        throw error;
    }
};

export const updateAtributo = async (id: number, data: Partial<AtributoPayload>): Promise<Atributo> => {
    try {
        const response = await apiClient.put<Atributo>(`/atributos/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el atributo ${id}:`, error);
        throw error;
    }
};

export const deactivateAtributo = async (id: number): Promise<Atributo> => {
    try {
        const response = await apiClient.put<Atributo>(`/atributos/${id}/deactivate`);
        return response.data;
    } catch (error) {
        console.error(`Error al desactivar el atributo ${id}:`, error);
        throw error;
    }
};

export const activateAtributo = async (id: number): Promise<Atributo> => {
    try {
        const response = await apiClient.put<Atributo>(`/atributos/${id}/activate`);
        return response.data;
    } catch (error) {
        console.error(`Error al activar el atributo ${id}:`, error);
        throw error;
    }
};
// frontend/src/features/casos/services/casoService.ts

import apiClient from '../../../api/axios';
import type { Caso, CrearCasoPayload, ActualizarCasoPayload } from '../types';

// ===== CRUD Básico =====

export const getCasos = async (): Promise<Caso[]> => {
    const response = await apiClient.get<Caso[]>('/casos');
    return response.data;
};

export const getCasoById = async (id: number): Promise<Caso> => {
    const response = await apiClient.get<Caso>(`/casos/${id}`);
    return response.data;
};

export const crearCaso = async (caso: CrearCasoPayload): Promise<Caso> => {
    const response = await apiClient.post<Caso>('/casos', caso);
    return response.data;
};

export const actualizarCaso = async (id: number, data: ActualizarCasoPayload): Promise<Caso> => {
    const response = await apiClient.put<Caso>(`/casos/${id}`, data);
    return response.data;
};

// ===== Acciones de Estado =====

export const activarCaso = async (id: number): Promise<Caso> => {
    const response = await apiClient.put<Caso>(`/casos/${id}/activar`);
    return response.data;
};

export const desactivarCaso = async (id: number): Promise<Caso> => {
    const response = await apiClient.put<Caso>(`/casos/${id}/desactivar`);
    return response.data;
};


// frontend/src/features/tipos-caso/services/tipoCasoService.ts

import apiClient from '../../../api/axios';
import type { TipoCaso, CrearTipoCasoPayload, ActualizarTipoCasoPayload } from '../types';

export const getTiposCaso = async (): Promise<TipoCaso[]> => {
    const response = await apiClient.get<TipoCaso[]>('/tipos-caso');
    return response.data;
};

export const getTiposCasoActivos = async (): Promise<TipoCaso[]> => {
    const response = await apiClient.get<TipoCaso[]>('/tipos-caso/activos');
    return response.data;
};

export const getTipoCasoById = async (id: number): Promise<TipoCaso> => {
    const response = await apiClient.get<TipoCaso>(`/tipos-caso/${id}`);
    return response.data;
};

export const crearTipoCaso = async (tipoCaso: CrearTipoCasoPayload): Promise<TipoCaso> => {
    const response = await apiClient.post<TipoCaso>('/tipos-caso', tipoCaso);
    return response.data;
};

export const actualizarTipoCaso = async (id: number, data: ActualizarTipoCasoPayload): Promise<TipoCaso> => {
    const response = await apiClient.put<TipoCaso>(`/tipos-caso/${id}`, data);
    return response.data;
};

export const activarTipoCaso = async (id: number): Promise<TipoCaso> => {
    const response = await apiClient.put<TipoCaso>(`/tipos-caso/${id}/activar`);
    return response.data;
};

export const desactivarTipoCaso = async (id: number): Promise<TipoCaso> => {
    const response = await apiClient.put<TipoCaso>(`/tipos-caso/${id}/desactivar`);
    return response.data;
};

export const getTipoCasoByCategoria = async (categoria: string): Promise<TipoCaso | null> => {
    const response = await apiClient.get<TipoCaso | null>(`/tipos-caso/categoria/${categoria}`);
    return response.data;
};


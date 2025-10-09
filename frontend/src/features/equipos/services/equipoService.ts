// frontend/src/features/equipos/services/equipoService.ts

import apiClient from '../../../api/axios';
import type { Equipo, CrearEquipoPayload, ActualizarEquipoPayload } from '../types';

// ===== CRUD Básico =====

export const getEquipos = async (): Promise<Equipo[]> => {
    const response = await apiClient.get<Equipo[]>('/equipos');
    return response.data;
};

export const getEquipoById = async (id: number): Promise<Equipo> => {
    const response = await apiClient.get<Equipo>(`/equipos/${id}`);
    return response.data;
};

export const getEquiposByUsuarioB2B = async (idUsuarioB2B: number): Promise<Equipo[]> => {
    const response = await apiClient.get<Equipo[]>(`/equipos/${idUsuarioB2B}`);
    return response.data;
};

export const crearEquipo = async (equipo: CrearEquipoPayload): Promise<Equipo> => {
    const response = await apiClient.post<Equipo>('/equipos', equipo);
    return response.data;
};

export const actualizarEquipo = async (id: number, data: ActualizarEquipoPayload): Promise<Equipo> => {
    const response = await apiClient.put<Equipo>(`/equipos/${id}`, data);
    return response.data;
};

// ===== Acciones de Estado =====

export const activarEquipo = async (id: number): Promise<Equipo> => {
    const response = await apiClient.put<Equipo>(`/equipos/${id}/activar`);
    return response.data;
};

export const desactivarEquipo = async (id: number): Promise<Equipo> => {
    const response = await apiClient.put<Equipo>(`/equipos/${id}/desactivar`);
    return response.data;
};


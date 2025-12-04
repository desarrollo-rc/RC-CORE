// frontend/src/features/equipos/services/equipoService.ts

import apiClient from '../../../api/axios';
import type { Equipo, CrearEquipoPayload, ActualizarEquipoPayload, EquipoFilters, PaginatedEquiposResponse } from '../types';

// ===== CRUD Básico =====

export const getEquipos = async (filters?: EquipoFilters): Promise<PaginatedEquiposResponse> => {
    // Si se pasan filtros con paginación, retornar respuesta paginada
    const response = await apiClient.get<PaginatedEquiposResponse | Equipo[]>('/equipos', { params: filters });
    
    // Si la respuesta es un array (sin paginación), convertirla a formato paginado para compatibilidad
    if (Array.isArray(response.data)) {
        return {
            equipos: response.data,
            pagination: {
                page: 1,
                pages: 1,
                per_page: response.data.length,
                total: response.data.length
            }
        };
    }
    
    // Si ya es una respuesta paginada, retornarla directamente
    return response.data as PaginatedEquiposResponse;
};

// Helper para obtener todos los equipos sin paginación (retorna array directo)
export const getAllEquipos = async (): Promise<Equipo[]> => {
    const response = await apiClient.get<Equipo[]>('/equipos');
    // Si la respuesta es un array, retornarlo directamente
    if (Array.isArray(response.data)) {
        return response.data;
    }
    // Si es un objeto paginado (no debería pasar si no se pasan parámetros), retornar solo los equipos
    return (response.data as PaginatedEquiposResponse).equipos || [];
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

export const desactivarEquipoCorp = async (id: number): Promise<{ success: boolean; message: string; equipo?: Equipo; error?: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string; equipo?: Equipo; error?: string }>(`/equipos/${id}/desactivar-corp`);
    return response.data;
};


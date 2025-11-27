// frontend/src/features/usuarios-b2b/services/usuarioB2BService.ts

import apiClient from '../../../api/axios';
import type { UsuarioB2B, CrearUsuarioB2BPayload, ActualizarUsuarioB2BPayload, UsuarioB2BFilters, PaginatedUsuariosB2BResponse } from '../types';

// ===== CRUD Básico =====

export const getUsuariosB2B = async (filters?: UsuarioB2BFilters): Promise<PaginatedUsuariosB2BResponse> => {
    const response = await apiClient.get<PaginatedUsuariosB2BResponse>('/usuarios-b2b', { params: filters });
    return response.data;
};

export const getUsuarioB2BById = async (id: number): Promise<UsuarioB2B> => {
    const response = await apiClient.get<UsuarioB2B>(`/usuarios-b2b/${id}`);
    return response.data;
};

export const crearUsuarioB2B = async (usuario: CrearUsuarioB2BPayload): Promise<UsuarioB2B> => {
    const response = await apiClient.post<UsuarioB2B>('/usuarios-b2b', usuario);
    return response.data;
};

export const actualizarUsuarioB2B = async (id: number, data: ActualizarUsuarioB2BPayload): Promise<UsuarioB2B> => {
    const response = await apiClient.put<UsuarioB2B>(`/usuarios-b2b/${id}`, data);
    return response.data;
};

// ===== Acciones de Estado =====

export const activarUsuarioB2B = async (id: number): Promise<UsuarioB2B> => {
    const response = await apiClient.put<UsuarioB2B>(`/usuarios-b2b/${id}/activar`);
    return response.data;
};

export const desactivarUsuarioB2B = async (id: number): Promise<UsuarioB2B> => {
    const response = await apiClient.put<UsuarioB2B>(`/usuarios-b2b/${id}/desactivar`);
    return response.data;
};

// ===== Servicios para Instalaciones =====

export const getUsuariosB2BByCliente = async (clienteId: number): Promise<UsuarioB2B[]> => {
    const response = await apiClient.get<UsuarioB2B[]>(`/usuarios-b2b/cliente/${clienteId}`);
    return response.data;
};

export const sugerirNombreUsuario = async (clienteId: number): Promise<{ nombre_sugerido: string }> => {
    const response = await apiClient.get<{ nombre_sugerido: string }>(`/usuarios-b2b/cliente/${clienteId}/sugerir-usuario`);
    return response.data;
};


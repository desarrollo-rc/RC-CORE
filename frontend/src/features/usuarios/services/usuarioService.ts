// src/features/usuarios/services/usuarioService.ts

import apiClient from '../../../api/axios';
import type { Usuario, UsuarioPayload } from '../types';

/**
 * Obtiene todos los usuarios desde la API.
 * Por ahora, trae todos; en el futuro podríamos añadir un filtro para los inactivos.
 */
export const getUsuarios = async (): Promise<Usuario[]> => {
    try {
        const response = await apiClient.get<Usuario[]>('/usuarios');
        return response.data;
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        throw error;
    }
};

/**
 * Crea un nuevo usuario.
 * @param userData - Los datos del usuario a crear.
 */
export const createUsuario = async (userData: UsuarioPayload): Promise<Usuario> => {
    try {
        const response = await apiClient.post<Usuario>('/usuarios', userData);
        return response.data;
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        throw error;
    }
};

/**
 * Actualiza un usuario existente.
 * La contraseña es opcional en la actualización.
 * @param usuarioId - El ID del usuario a actualizar.
 * @param userData - Los nuevos datos para el usuario.
 */
export const updateUsuario = async (usuarioId: number, userData: Partial<UsuarioPayload>): Promise<Usuario> => {
    try {
        const response = await apiClient.put<Usuario>(`/usuarios/${usuarioId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el usuario ${usuarioId}:`, error);
        throw error;
    }
};

/**
 * Desactiva un usuario.
 * @param usuarioId - El ID del usuario a desactivar.
 */
export const deactivateUsuario = async (usuarioId: number): Promise<Usuario> => {
    try {
        const response = await apiClient.put<Usuario>(`/usuarios/${usuarioId}/deactivate`);
        return response.data;
    } catch (error) {
        console.error(`Error al desactivar el usuario ${usuarioId}:`, error);
        throw error;
    }
};

/**
 * Activa un usuario.
 * @param usuarioId - El ID del usuario a activar.
 */
export const activateUsuario = async (usuarioId: number): Promise<Usuario> => {
    try {
        const response = await apiClient.put<Usuario>(`/usuarios/${usuarioId}/activate`);
        return response.data;
    } catch (error) {
        console.error(`Error al activar el usuario ${usuarioId}:`, error);
        throw error;
    }
};
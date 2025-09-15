// src/features/roles/services/rolService.ts

import apiClient from '../../../api/axios';
import type { Rol, RolPayload } from '../types';

/**
 * Obtiene todos los roles desde la API.
 */
export const getRoles = async (): Promise<Rol[]> => {
    try {
        const response = await apiClient.get<Rol[]>('/roles');
        return response.data;
    } catch (error) {
        console.error('Error al obtener los roles:', error);
        throw error;
    }
};

/**
 * Crea un nuevo rol.
 * @param rolData - Los datos del rol a crear, incluyendo los IDs de los permisos.
 */
export const createRol = async (rolData: RolPayload): Promise<Rol> => {
    try {
        const response = await apiClient.post<Rol>('/roles', rolData);
        return response.data;
    } catch (error) {
        console.error('Error al crear el rol:', error);
        throw error;
    }
};

/**
 * Actualiza un rol existente.
 * @param rolId - El ID del rol a actualizar.
 * @param rolData - Los nuevos datos para el rol.
 */
export const updateRol = async (rolId: number, rolData: Partial<RolPayload>): Promise<Rol> => {
    try {
        const response = await apiClient.put<Rol>(`/roles/${rolId}`, rolData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el rol ${rolId}:`, error);
        throw error;
    }
};

/**
 * Elimina un rol.
 * @param rolId - El ID del rol a eliminar.
 */
export const deleteRol = async (rolId: number): Promise<void> => {
    try {
        await apiClient.delete(`/roles/${rolId}`);
    } catch (error) {
        console.error(`Error al eliminar el rol ${rolId}:`, error);
        throw error;
    }
};
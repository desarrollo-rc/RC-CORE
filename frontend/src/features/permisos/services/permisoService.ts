// src/features/permisos/services/permisoService.ts

import apiClient from '../../../api/axios';
import type { Permiso, PermisoPayload } from '../types';

/**
 * Obtiene todos los permisos desde la API.
 */
export const getPermisos = async (): Promise<Permiso[]> => {
    try {
        const response = await apiClient.get<Permiso[]>('/permisos');
        return response.data;
    } catch (error) {
        console.error('Error al obtener los permisos:', error);
        throw error;
    }
};

/**
 * Crea un nuevo permiso.
 * @param permisoData - Los datos del permiso a crear.
 */
export const createPermiso = async (permisoData: PermisoPayload): Promise<Permiso> => {
    try {
        const response = await apiClient.post<Permiso>('/permisos', permisoData);
        return response.data;
    } catch (error) {
        console.error('Error al crear el permiso:', error);
        throw error;
    }
};

/**
 * Actualiza un permiso existente.
 * @param permisoId - El ID del permiso a actualizar.
 * @param permisoData - Los nuevos datos para el permiso.
 */
export const updatePermiso = async (permisoId: number, permisoData: Partial<PermisoPayload>): Promise<Permiso> => {
    try {
        const response = await apiClient.put<Permiso>(`/permisos/${permisoId}`, permisoData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el permiso ${permisoId}:`, error);
        throw error;
    }
};

/**
 * Elimina un permiso.
 * @param permisoId - El ID del permiso a eliminar.
 */
export const deletePermiso = async (permisoId: number): Promise<void> => {
    try {
        await apiClient.delete(`/permisos/${permisoId}`);
    } catch (error) {
        console.error(`Error al eliminar el permiso ${permisoId}:`, error);
        throw error;
    }
};
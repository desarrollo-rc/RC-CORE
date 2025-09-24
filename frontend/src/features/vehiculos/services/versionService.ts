// frontend/src/features/vehiculos/services/versionService.ts
import apiClient from '../../../api/axios';
import type { VersionPayload, VersionVehiculo } from '../types';

export const getVersionesPorModelo = async (marcaId: number, modeloId: number): Promise<VersionVehiculo[]> => {
    const response = await apiClient.get<VersionVehiculo[]>(`/marcas/${marcaId}/modelos/${modeloId}/versiones`);
    return response.data;
};

export const createVersion = async (marcaId: number, modeloId: number, data: VersionPayload): Promise<VersionVehiculo> => {
    const response = await apiClient.post<VersionVehiculo>(`/marcas/${marcaId}/modelos/${modeloId}/versiones`, data);
    return response.data;
};

export const updateVersion = async (marcaId: number, modeloId: number, versionId: number, data: Partial<VersionPayload>): Promise<VersionVehiculo> => {
    const response = await apiClient.put<VersionVehiculo>(`/marcas/${marcaId}/modelos/${modeloId}/versiones/${versionId}`, data);
    return response.data;
};

export const deactivateVersion = async (marcaId: number, modeloId: number, versionId: number): Promise<VersionVehiculo> => {
    const response = await apiClient.put<VersionVehiculo>(`/marcas/${marcaId}/modelos/${modeloId}/versiones/${versionId}/deactivate`);
    return response.data;
};

export const activateVersion = async (marcaId: number, modeloId: number, versionId: number): Promise<VersionVehiculo> => {
    const response = await apiClient.put<VersionVehiculo>(`/marcas/${marcaId}/modelos/${modeloId}/versiones/${versionId}/activate`);
    return response.data;
};
// frontend/src/features/vehiculos/services/vehiculoService.ts
import apiClient from '../../../api/axios';
import type { MarcaVehiculo, Modelo, VersionVehiculo, ModeloPayload, VersionPayload } from '../types';

export const getAllVersiones = async (): Promise<VersionVehiculo[]> => {
    const response = await apiClient.get<VersionVehiculo[]>('/vehiculos/versiones');
    return response.data;
};

// --- LECTURA (GET) ---
export const getMarcasVehiculos = async (): Promise<MarcaVehiculo[]> => {
    // Usamos el filtro 'ambito' que creamos en el backend
    const response = await apiClient.get<MarcaVehiculo[]>('/marcas', { params: { ambito: 'vehiculo' } });
    return response.data;
};

export const getModelosPorMarca = async (marcaId: number): Promise<Modelo[]> => {
    const response = await apiClient.get<Modelo[]>(`/marcas/${marcaId}/modelos`);
    return response.data;
};

export const getVersionesPorModelo = async (marcaId: number, modeloId: number): Promise<VersionVehiculo[]> => {
    const response = await apiClient.get<VersionVehiculo[]>(`/marcas/${marcaId}/modelos/${modeloId}/versiones`);
    return response.data;
};

// --- ESCRITURA (CREATE, UPDATE) ---
export const createModelo = async (marcaId: number, data: ModeloPayload): Promise<Modelo> => {
    const response = await apiClient.post<Modelo>(`/marcas/${marcaId}/modelos`, data);
    return response.data;
};

export const updateModelo = async (marcaId: number, modeloId: number, data: Partial<ModeloPayload>): Promise<Modelo> => {
    const response = await apiClient.put<Modelo>(`/marcas/${marcaId}/modelos/${modeloId}`, data);
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
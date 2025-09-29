// frontend/src/features/geografia/services/geografiaService.ts
import apiClient from '../../../api/axios';
import type { Pais, Region, Ciudad, Comuna } from '../types';

export const getPaises = async (): Promise<Pais[]> => {
    const response = await apiClient.get<Pais[]>('/geografia/paises');
    return response.data;
};

export const getRegiones = async (paisId: number): Promise<Region[]> => {
    const response = await apiClient.get<Region[]>(`/geografia/regiones`, { params: { pais_id: paisId } });
    return response.data;
};

export const getCiudades = async (regionId: number): Promise<Ciudad[]> => {
    const response = await apiClient.get<Ciudad[]>(`/geografia/ciudades`, { params: { region_id: regionId } });
    return response.data;
};

export const getComunas = async (ciudadId: number): Promise<Comuna[]> => {
    const response = await apiClient.get<Comuna[]>(`/geografia/comunas`, { params: { ciudad_id: ciudadId } });
    return response.data;
};
// src/features/valores-atributo/services/valorAtributoService.ts
import apiClient from '../../../api/axios';
import type { ValorAtributo, ValorAtributoPayload } from '../types';

// El atributoId es necesario para construir la URL anidada: /api/v1/atributos/{atributoId}/valores
export const getValores = async (atributoId: number): Promise<ValorAtributo[]> => {
    const response = await apiClient.get<ValorAtributo[]>(`/atributos/${atributoId}/valores`);
    return response.data;
};

export const createValor = async (atributoId: number, data: ValorAtributoPayload): Promise<ValorAtributo> => {
    const response = await apiClient.post<ValorAtributo>(`/atributos/${atributoId}/valores`, data);
    return response.data;
};

export const updateValor = async (atributoId: number, valorId: number, data: Partial<ValorAtributoPayload>): Promise<ValorAtributo> => {
    const response = await apiClient.put<ValorAtributo>(`/atributos/${atributoId}/valores/${valorId}`, data);
    return response.data;
};

export const deactivateValor = async (atributoId: number, valorId: number): Promise<ValorAtributo> => {
    const response = await apiClient.put<ValorAtributo>(`/atributos/${atributoId}/valores/${valorId}/deactivate`);
    return response.data;
};

export const activateValor = async (atributoId: number, valorId: number): Promise<ValorAtributo> => {
    const response = await apiClient.put<ValorAtributo>(`/atributos/${atributoId}/valores/${valorId}/activate`);
    return response.data;
};
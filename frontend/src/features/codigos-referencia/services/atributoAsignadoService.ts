// frontend/src/features/codigos-referencia/services/atributoAsignadoService.ts
import apiClient from '../../../api/axios';
import type { AtributoAsignado, AtributoAsignadoPayload } from '../types';

export const addAtributoAsignado = async (refId: number, data: AtributoAsignadoPayload): Promise<AtributoAsignado> => {
    const response = await apiClient.post<AtributoAsignado>(`/codigos-referencia/${refId}/atributos`, data);
    return response.data;
};

export const updateAtributoAsignado = async (refId: number, atributoId: number, data: Partial<AtributoAsignadoPayload>): Promise<AtributoAsignado> => {
    const response = await apiClient.put<AtributoAsignado>(`/codigos-referencia/${refId}/atributos/${atributoId}`, data);
    return response.data;
};

export const deleteAtributoAsignado = async (refId: number, atributoId: number): Promise<void> => {
    await apiClient.delete(`/codigos-referencia/${refId}/atributos/${atributoId}`);
};
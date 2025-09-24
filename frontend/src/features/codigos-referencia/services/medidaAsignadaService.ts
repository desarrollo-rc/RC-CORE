// frontend/src/features/codigos-referencia/services/medidaAsignadaService.ts

import apiClient from '../../../api/axios';
import type { MedidaAsignada, MedidaAsignadaPayload } from '../types';

export const addMedidaAsignada = async (refId: number, data: MedidaAsignadaPayload): Promise<MedidaAsignada> => {
    const response = await apiClient.post<MedidaAsignada>(`/codigos-referencia/${refId}/medidas`, data);
    return response.data;
};

export const updateMedidaAsignada = async (refId: number, medidaId: number, data: Partial<MedidaAsignadaPayload>): Promise<MedidaAsignada> => {
    const response = await apiClient.put<MedidaAsignada>(`/codigos-referencia/${refId}/medidas/${medidaId}`, data);
    return response.data;
};

export const deleteMedidaAsignada = async (refId: number, medidaId: number): Promise<void> => {
    await apiClient.delete(`/codigos-referencia/${refId}/medidas/${medidaId}`);
};
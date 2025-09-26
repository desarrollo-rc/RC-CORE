// frontend/src/features/condiciones-pago/services/condicionPagoService.ts
import apiClient from '../../../api/axios';
import type { CondicionPago, CondicionPagoPayload } from '../types';

export const getCondicionesPago = async (includeInactive: boolean = false): Promise<CondicionPago[]> => {
    const response = await apiClient.get<CondicionPago[]>('/condiciones-pago', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createCondicionPago = async (data: CondicionPagoPayload): Promise<CondicionPago> => {
    const response = await apiClient.post<CondicionPago>('/condiciones-pago', data);
    return response.data;
};

export const updateCondicionPago = async (id: number, data: Partial<CondicionPagoPayload>): Promise<CondicionPago> => {
    const response = await apiClient.put<CondicionPago>(`/condiciones-pago/${id}`, data);
    return response.data;
};

export const deactivateCondicionPago = async (id: number): Promise<CondicionPago> => {
    const response = await apiClient.put<CondicionPago>(`/condiciones-pago/${id}/deactivate`);
    return response.data;
};

export const activateCondicionPago = async (id: number): Promise<CondicionPago> => {
    const response = await apiClient.put<CondicionPago>(`/condiciones-pago/${id}/activate`);
    return response.data;
};
// frontend/src/features/segmentos-cliente/services/segmentoClienteService.ts
import apiClient from '../../../api/axios';
import type { SegmentoCliente, SegmentoClientePayload } from '../types';

export const getSegmentosCliente = async (includeInactive: boolean = false): Promise<SegmentoCliente[]> => {
    const response = await apiClient.get<SegmentoCliente[]>('/segmentos-cliente', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createSegmentoCliente = async (data: SegmentoClientePayload): Promise<SegmentoCliente> => {
    const response = await apiClient.post<SegmentoCliente>('/segmentos-cliente', data);
    return response.data;
};

export const updateSegmentoCliente = async (id: number, data: Partial<SegmentoClientePayload>): Promise<SegmentoCliente> => {
    const response = await apiClient.put<SegmentoCliente>(`/segmentos-cliente/${id}`, data);
    return response.data;
};

export const deactivateSegmentoCliente = async (id: number): Promise<SegmentoCliente> => {
    const response = await apiClient.put<SegmentoCliente>(`/segmentos-cliente/${id}/deactivate`);
    return response.data;
};

export const activateSegmentoCliente = async (id: number): Promise<SegmentoCliente> => {
    const response = await apiClient.put<SegmentoCliente>(`/segmentos-cliente/${id}/activate`);
    return response.data;
};
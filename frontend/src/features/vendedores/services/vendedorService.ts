// frontend/src/features/vendedores/services/vendedorService.ts
import apiClient from '../../../api/axios';
import type { Vendedor, VendedorPayload } from '../types';

export const getVendedores = async (includeInactive: boolean = false): Promise<Vendedor[]> => {
    const response = await apiClient.get<Vendedor[]>('/vendedores', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};
export const getVendedorById = async (id: number): Promise<Vendedor> => {
    const response = await apiClient.get<Vendedor>(`/vendedores/${id}`);
    return response.data;
};

export const createVendedor = async (data: VendedorPayload): Promise<Vendedor> => {
    const response = await apiClient.post<Vendedor>('/vendedores', data);
    return response.data;
};

export const updateVendedor = async (id: number, data: Partial<VendedorPayload>): Promise<Vendedor> => {
    const response = await apiClient.put<Vendedor>(`/vendedores/${id}`, data);
    return response.data;
};

export const deactivateVendedor = async (id: number): Promise<Vendedor> => {
    const response = await apiClient.put<Vendedor>(`/vendedores/${id}/deactivate`);
    return response.data;
};

export const activateVendedor = async (id: number): Promise<Vendedor> => {
    const response = await apiClient.put<Vendedor>(`/vendedores/${id}/activate`);
    return response.data;
};
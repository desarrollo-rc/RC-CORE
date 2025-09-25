// frontend/src/features/proveedores/services/proveedorService.ts
import apiClient from '../../../api/axios';
import type { Proveedor, ProveedorPayload } from '../types';

export const getProveedores = async (includeInactive: boolean = false): Promise<Proveedor[]> => {
    const response = await apiClient.get<Proveedor[]>('/proveedores', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createProveedor = async (data: ProveedorPayload): Promise<Proveedor> => {
    const response = await apiClient.post<Proveedor>('/proveedores', data);
    return response.data;
};

export const updateProveedor = async (id: number, data: Partial<ProveedorPayload>): Promise<Proveedor> => {
    const response = await apiClient.put<Proveedor>(`/proveedores/${id}`, data);
    return response.data;
};

export const deactivateProveedor = async (id: number): Promise<Proveedor> => {
    const response = await apiClient.put<Proveedor>(`/proveedores/${id}/deactivate`);
    return response.data;
};

export const activateProveedor = async (id: number): Promise<Proveedor> => {
    const response = await apiClient.put<Proveedor>(`/proveedores/${id}/activate`);
    return response.data;
};
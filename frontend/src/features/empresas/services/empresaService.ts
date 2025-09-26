// frontend/src/features/empresas/services/empresaService.ts
import apiClient from '../../../api/axios';
import type { Empresa, EmpresaPayload } from '../types';

export const getEmpresas = async (includeInactive: boolean = false): Promise<Empresa[]> => {
    const response = await apiClient.get<Empresa[]>('/empresas', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createEmpresa = async (data: EmpresaPayload): Promise<Empresa> => {
    const response = await apiClient.post<Empresa>('/empresas', data);
    return response.data;
};

export const updateEmpresa = async (id: number, data: Partial<EmpresaPayload>): Promise<Empresa> => {
    const response = await apiClient.put<Empresa>(`/empresas/${id}`, data);
    return response.data;
};

export const deactivateEmpresa = async (id: number): Promise<Empresa> => {
    const response = await apiClient.put<Empresa>(`/empresas/${id}/deactivate`);
    return response.data;
};

export const activateEmpresa = async (id: number): Promise<Empresa> => {
    const response = await apiClient.put<Empresa>(`/empresas/${id}/activate`);
    return response.data;
};
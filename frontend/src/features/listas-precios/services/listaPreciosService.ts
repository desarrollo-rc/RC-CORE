// frontend/src/features/listas-precios/services/listaPreciosService.ts
import apiClient from '../../../api/axios';
import type { ListaPrecios, ListaPreciosPayload } from '../types';

export const getListasPrecios = async (includeInactive: boolean = false): Promise<ListaPrecios[]> => {
    const response = await apiClient.get<ListaPrecios[]>('/listas-precios', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const createListaPrecios = async (data: ListaPreciosPayload): Promise<ListaPrecios> => {
    const response = await apiClient.post<ListaPrecios>('/listas-precios', data);
    return response.data;
};

export const updateListaPrecios = async (id: number, data: Partial<ListaPreciosPayload>): Promise<ListaPrecios> => {
    const response = await apiClient.put<ListaPrecios>(`/listas-precios/${id}`, data);
    return response.data;
};

export const deactivateListaPrecios = async (id: number): Promise<ListaPrecios> => {
    const response = await apiClient.put<ListaPrecios>(`/listas-precios/${id}/deactivate`);
    return response.data;
};

export const activateListaPrecios = async (id: number): Promise<ListaPrecios> => {
    const response = await apiClient.put<ListaPrecios>(`/listas-precios/${id}/activate`);
    return response.data;
};
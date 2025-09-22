// src/features/categorizacion/services/categorizacionService.ts

import apiClient from '../../../api/axios';
import type { Categoria, CategoriaPayload, SubCategoria, SubCategoriaPayload, DetSubCategoria, DetSubCategoriaPayload } from '../types';

export const getCategoriasPorDivision = async (divisionId: number): Promise<Categoria[]> => {
    const response = await apiClient.get<Categoria[]>(`/categorias/por-division/${divisionId}`);
    return response.data;
};

export const getCategorias = async (includeInactive: boolean = false): Promise<Categoria[]> => {
    const response = await apiClient.get<Categoria[]>('/categorias', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const getCategoriaById = async (id: number): Promise<Categoria> => {
    const response = await apiClient.get<Categoria>(`/categorias/${id}`);
    return response.data;
};

export const createCategoria = async (data: CategoriaPayload): Promise<Categoria> => {
    const response = await apiClient.post<Categoria>('/categorias', data);
    return response.data;
};

export const updateCategoria = async (id: number, data: Partial<CategoriaPayload>): Promise<Categoria> => {
    const response = await apiClient.put<Categoria>(`/categorias/${id}`, data);
    return response.data;
};

export const deactivateCategoria = async (id: number): Promise<Categoria> => {
    const response = await apiClient.put<Categoria>(`/categorias/${id}/deactivate`);
    return response.data;
};

export const activateCategoria = async (id: number): Promise<Categoria> => {
    const response = await apiClient.put<Categoria>(`/categorias/${id}/activate`);
    return response.data;
};

export const getSubCategoriasPorCategoria = async (categoriaId: number): Promise<SubCategoria[]> => {
    const response = await apiClient.get<SubCategoria[]>(`/sub-categorias/por-categoria/${categoriaId}`);
    return response.data;
};

export const getSubCategorias = async (includeInactive: boolean = false): Promise<SubCategoria[]> => {
    const response = await apiClient.get<SubCategoria[]>('/sub-categorias', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const getSubCategoriaById = async (id: number): Promise<SubCategoria> => {
    const response = await apiClient.get<SubCategoria>(`/sub-categorias/${id}`);
    return response.data;
};

export const createSubCategoria = async (data: SubCategoriaPayload): Promise<SubCategoria> => {
    const response = await apiClient.post<SubCategoria>('/sub-categorias', data);
    return response.data;
};

export const updateSubCategoria = async (id: number, data: Partial<SubCategoriaPayload>): Promise<SubCategoria> => {
    const response = await apiClient.put<SubCategoria>(`/sub-categorias/${id}`, data);
    return response.data;
};

export const deactivateSubCategoria = async (id: number): Promise<SubCategoria> => {
    const response = await apiClient.put<SubCategoria>(`/sub-categorias/${id}/deactivate`);
    return response.data;
};

export const activateSubCategoria = async (id: number): Promise<SubCategoria> => {
    const response = await apiClient.put<SubCategoria>(`/sub-categorias/${id}/activate`);
    return response.data;
};

export const getDetallesPorSubCategoria = async (subcategoriaId: number): Promise<DetSubCategoria[]> => {
    const response = await apiClient.get<DetSubCategoria[]>(`/det-sub-categorias/por-subcategoria/${subcategoriaId}`);
    return response.data;
};

export const getDetSubCategoriaById = async (id: number): Promise<DetSubCategoria> => {
    const response = await apiClient.get<DetSubCategoria>(`/det-sub-categorias/${id}`);
    return response.data;
};

export const createDetSubCategoria = async (data: DetSubCategoriaPayload): Promise<DetSubCategoria> => {
    const response = await apiClient.post<DetSubCategoria>('/det-sub-categorias', data);
    return response.data;
};

export const updateDetSubCategoria = async (id: number, data: Partial<DetSubCategoriaPayload>): Promise<DetSubCategoria> => {
    const response = await apiClient.put<DetSubCategoria>(`/det-sub-categorias/${id}`, data);
    return response.data;
};

export const deactivateDetSubCategoria = async (id: number): Promise<DetSubCategoria> => {
    const response = await apiClient.put<DetSubCategoria>(`/det-sub-categorias/${id}/deactivate`);
    return response.data;
};

export const activateDetSubCategoria = async (id: number): Promise<DetSubCategoria> => {
    const response = await apiClient.put<DetSubCategoria>(`/det-sub-categorias/${id}/activate`);
    return response.data;
};
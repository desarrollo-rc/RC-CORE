// frontend/src/features/productos/services/productoService.ts
import apiClient from '../../../api/axios';
import type { Producto, ProductoPayload, PaginatedProductosResponse } from '../types';

interface ProductoFilters {
    page?: number;
    per_page?: number;
    // ... otros filtros que puedas necesitar
}

export const getProductos = async (filters: ProductoFilters): Promise<PaginatedProductosResponse> => {
    const response = await apiClient.get<PaginatedProductosResponse>('/productos', { params: filters });
    return response.data;
};

export const getProductosPaginados = async (filters: ProductoFilters): Promise<PaginatedProductosResponse> => {
    const response = await apiClient.get<PaginatedProductosResponse>('/productos', { params: filters });
    return response.data;
};

export const getAllProductos = async (): Promise<Producto[]> => {
    const response = await apiClient.get<Producto[] | { items: Producto[] }>('/productos', { params: { page: 1, per_page: 2000 } });
    return Array.isArray(response.data) ? response.data : response.data.items;
};

export const getProductoBySku = async (sku: string): Promise<Producto> => {
    const response = await apiClient.get<Producto>(`/productos/sku/${sku}`);
    return response.data;
};

export const createProducto = async (data: ProductoPayload): Promise<Producto> => {
    const response = await apiClient.post<Producto>('/productos', data);
    return response.data;
};

export const updateProducto = async (id: number, data: Partial<ProductoPayload>): Promise<Producto> => {
    const response = await apiClient.put<Producto>(`/productos/${id}`, data);
    return response.data;
};

export const deactivateProducto = async (id: number, razon_bloqueo: string): Promise<Producto> => {
    const response = await apiClient.put<Producto>(`/productos/${id}/deactivate`, { razon_bloqueo });
    return response.data;
};

export const activateProducto = async (id: number): Promise<Producto> => {
    const response = await apiClient.put<Producto>(`/productos/${id}/activate`);
    return response.data;
};
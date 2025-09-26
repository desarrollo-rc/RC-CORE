// frontend/src/features/productos/services/productoService.ts
import apiClient from '../../../api/axios';
import type { Producto, ProductoPayload } from '../types';

export const getProductos = async (includeInactive: boolean = false): Promise<Producto[]> => {
    const response = await apiClient.get<Producto[]>('/productos', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
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
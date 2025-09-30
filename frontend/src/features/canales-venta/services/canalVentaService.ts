// frontend/src/features/canales-venta/services/canalVentaService.ts
import apiClient from '../../../api/axios';
import type { CanalVenta } from '../types';

export const getCanalesVenta = async (): Promise<CanalVenta[]> => {
    const response = await apiClient.get<CanalVenta[] | { items: CanalVenta[] }>('/canales-venta');
    return Array.isArray(response.data) ? response.data : response.data.items;
};
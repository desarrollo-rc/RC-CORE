// frontend/src/features/compras/services/comprasService.ts
import api from '../../../api/axios';
import type { CompraRealizada, CompraFilters, CotizacionData, ExcelUploadResult } from '../types';

// Servicios para Compras Realizadas (placeholder para futuras implementaciones)
export const getComprasRealizadas = async (filters?: CompraFilters): Promise<CompraRealizada[]> => {
  try {
    const response = await api.get('/compras/realizadas', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo compras realizadas:', error);
    throw error;
  }
};

export const getCompraById = async (id: number): Promise<CompraRealizada> => {
  try {
    const response = await api.get(`/compras/realizadas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo compra:', error);
    throw error;
  }
};

export const createCompra = async (compraData: Partial<CompraRealizada>): Promise<CompraRealizada> => {
  try {
    const response = await api.post('/compras/realizadas', compraData);
    return response.data;
  } catch (error) {
    console.error('Error creando compra:', error);
    throw error;
  }
};

export const updateCompra = async (id: number, compraData: Partial<CompraRealizada>): Promise<CompraRealizada> => {
  try {
    const response = await api.put(`/compras/realizadas/${id}`, compraData);
    return response.data;
  } catch (error) {
    console.error('Error actualizando compra:', error);
    throw error;
  }
};

export const deleteCompra = async (id: number): Promise<void> => {
  try {
    await api.delete(`/compras/realizadas/${id}`);
  } catch (error) {
    console.error('Error eliminando compra:', error);
    throw error;
  }
};

// Servicios para el Cotizador
export const uploadExcelCotizacion = async (file: File): Promise<ExcelUploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/compras/cotizador/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo Excel:', error);
    throw error;
  }
};

export const saveCotizacion = async (cotizacionData: CotizacionData, nombre?: string, observaciones?: string): Promise<{ id: number; message: string }> => {
  try {
    const response = await api.post('/compras/cotizador/save', {
      data: cotizacionData,
      nombre,
      observaciones
    });
    return response.data;
  } catch (error) {
    console.error('Error guardando cotización:', error);
    throw error;
  }
};

export const getCotizaciones = async (filters?: any): Promise<any[]> => {
  try {
    const response = await api.get('/compras/cotizador', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    throw error;
  }
};

export const getCotizacionById = async (id: number): Promise<any> => {
  try {
    const response = await api.get(`/compras/cotizador/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    throw error;
  }
};

export const deleteCotizacion = async (id: number): Promise<void> => {
  try {
    await api.delete(`/compras/cotizador/${id}`);
  } catch (error) {
    console.error('Error eliminando cotización:', error);
    throw error;
  }
};

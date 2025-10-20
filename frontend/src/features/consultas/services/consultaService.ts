// frontend/src/features/consultas/services/consultaService.ts
import apiClient from '../../../api/axios';
import type { Consulta, ConsultaCreate } from '../types';

export const getConsultas = async (): Promise<Consulta[]> => {
    const response = await apiClient.get<Consulta[]>('/consultas'); // Asumo que tienes una ruta para listar todas
    return response.data;
};

export const createConsulta = async (data: ConsultaCreate): Promise<Consulta> => {
    const response = await apiClient.post<Consulta>('/consultas', data);
    return response.data;
};

export const getConsultaByCodigo = async (codigo: string): Promise<Consulta> => {
    const response = await apiClient.get<Consulta>(`/consultas/${codigo}`);
    return response.data;
};

export const executeConsulta = async (codigo: string, params?: Record<string, any>) => {
    const response = await apiClient.post(`/consultas/${codigo}/execute`, { parametros: params });
    return response.data;
};

export const sincronizarPedidosB2B = async () => {
    const response = await apiClient.post('/consultas/procesos/sincronizar-pedidos-b2b');
    return response.data;
};

export const updateConsulta = async (codigo: string, data: Partial<Consulta>): Promise<Consulta> => {
    const response = await apiClient.put<Consulta>(`/consultas/${codigo}`, data);
    return response.data;
};

export const downloadConsultaExcel = async (codigo: string, params?: Record<string, any>): Promise<Blob> => {
    const response = await apiClient.post(
        `/consultas/${codigo}/download-excel`, 
        { parametros: params },
        { responseType: 'blob' }
    );
    return response.data;
};
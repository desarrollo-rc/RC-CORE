// frontend/src/features/instalaciones/services/instalacionService.ts

import apiClient from '../../../api/axios';
import type { 
    Instalacion, 
    NuevaInstalacion, 
    ActualizarInstalacion, 
    CrearUsuarioB2BPayload,
    CrearInstalacionCompletaPayload,
    CrearInstalacionCompletaResponse
} from '../types';

// ===== CRUD Básico =====

export const getInstalaciones = async (): Promise<Instalacion[]> => {
    const response = await apiClient.get<Instalacion[]>('/instalaciones');
    return response.data;
};

export const getInstalacionById = async (id: number): Promise<Instalacion> => {
    const response = await apiClient.get<Instalacion>(`/instalaciones/${id}`);
    return response.data;
};

export const crearInstalacion = async (instalacion: NuevaInstalacion): Promise<Instalacion> => {
    const response = await apiClient.post<Instalacion>('/instalaciones', instalacion);
    return response.data;
};

export const actualizarInstalacion = async (id: number, data: ActualizarInstalacion): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}`, data);
    return response.data;
};

// ===== Acciones de Flujo de Instalación =====

export const aprobarInstalacion = async (id: number, data?: { fecha_aprobacion_personalizada?: string }): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/aprobar`, data || {});
    return response.data;
};

export const rechazarInstalacion = async (id: number, observaciones: string): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}`, {
        estado: 'Cancelada',
        observaciones
    });
    return response.data;
};

export const crearUsuarioInstalacion = async (id: number, payload: CrearUsuarioB2BPayload): Promise<Instalacion> => {
    const response = await apiClient.post<Instalacion>(`/instalaciones/${id}/crear-usuario`, payload);
    return response.data;
};

export const sincronizarEquipos = async (id: number): Promise<{ ok: boolean; equipos: any[] }> => {
    const response = await apiClient.post<{ ok: boolean; equipos: any[] }>(`/instalaciones/${id}/sincronizar-equipos`);
    return response.data;
};

export const crearEquipoInstalacion = async (id: number, equipoData: {
    nombre_equipo: string;
    mac_address: string;
    procesador: string;
    placa_madre: string;
    disco_duro: string;
}): Promise<any> => {
    const response = await apiClient.post(`/instalaciones/${id}/crear-equipo`, equipoData);
    return response.data;
};

export const activarEquipo = async (id: number, equipo_id: number): Promise<{ success: boolean; message: string; equipos_desactivados: number }> => {
    const response = await apiClient.post<{ success: boolean; message: string; equipos_desactivados: number }>(`/instalaciones/${id}/activar-equipo`, { equipo_id });
    return response.data;
};

export const instalarEquipo = async (id: number, equipo_id: number, fecha_instalacion_personalizada?: string): Promise<Instalacion> => {
    const data: any = { equipo_id };
    if (fecha_instalacion_personalizada) {
        data.fecha_instalacion_personalizada = fecha_instalacion_personalizada;
    }
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/instalar`, data);
    return response.data;
};

export const finalizarInstalacion = async (id: number, capacitacion_realizada: boolean = true, fecha_finalizacion_personalizada?: string): Promise<Instalacion> => {
    const data: any = { capacitacion_realizada };
    if (fecha_finalizacion_personalizada) {
        data.fecha_finalizacion_personalizada = fecha_finalizacion_personalizada;
    }
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/finalizar`, data);
    return response.data;
};

// Mantener compatibilidad con código antiguo
export const marcarUsuarioCreado = crearUsuarioInstalacion;
export const marcarInstalada = instalarEquipo;
export const agendarInstalacion = async (id: number, fecha_visita?: string, fecha_agendamiento_personalizada?: string, observaciones?: string): Promise<Instalacion> => {
    const data: any = {};
    if (fecha_visita) data.fecha_visita = fecha_visita;
    if (fecha_agendamiento_personalizada) data.fecha_agendamiento_personalizada = fecha_agendamiento_personalizada;
    if (observaciones) data.observaciones = observaciones;
    
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/agendar`, data);
    return response.data;
};

// ===== Crear Instalación Completa (con caso automático) =====

export const crearInstalacionCompleta = async (payload: CrearInstalacionCompletaPayload): Promise<Instalacion> => {
    const response = await apiClient.post<Instalacion>('/instalaciones/completa', payload);
    return response.data;
};

export const crearInstalacionCompletaMultiple = async (payload: CrearInstalacionCompletaPayload): Promise<CrearInstalacionCompletaResponse> => {
    const response = await apiClient.post<CrearInstalacionCompletaResponse>('/instalaciones/completa-multiple', payload);
    return response.data;
};
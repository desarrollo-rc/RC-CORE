// frontend/src/features/instalaciones/services/instalacionService.ts

import apiClient from '../../../api/axios';
import type { 
    Instalacion, 
    NuevaInstalacion, 
    ActualizarInstalacion,
    AprobarInstalacionPayload,
    CrearUsuarioB2BPayload,
    RealizarInstalacionPayload,
    FinalizarInstalacionPayload,
    CrearInstalacionCompletaPayload
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

export const aprobarInstalacion = async (id: number): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/aprobar`);
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

export const instalarEquipo = async (id: number, equipo_id: number): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/instalar`, { equipo_id });
    return response.data;
};

export const finalizarInstalacion = async (id: number, capacitacion_realizada: boolean = true): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/finalizar`, { capacitacion_realizada });
    return response.data;
};

// Mantener compatibilidad con código antiguo
export const marcarUsuarioCreado = crearUsuarioInstalacion;
export const marcarInstalada = instalarEquipo;
export const agendarInstalacion = async (id: number, fecha_visita: string, observaciones?: string): Promise<Instalacion> => {
    const response = await apiClient.put<Instalacion>(`/instalaciones/${id}/agendar`, {
        fecha_visita,
        observaciones
    });
    return response.data;
};

// ===== Crear Instalación Completa (con caso automático) =====

export const crearInstalacionCompleta = async (payload: CrearInstalacionCompletaPayload): Promise<Instalacion> => {
    const response = await apiClient.post<Instalacion>('/instalaciones/completa', payload);
    return response.data;
};
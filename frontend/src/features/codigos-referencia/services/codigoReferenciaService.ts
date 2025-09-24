// frontend/src/features/codigos-referencia/services/codigoReferenciaService.ts

import apiClient from '../../../api/axios';
import type { 
    CodigoReferencia, 
    CodigoReferenciaPayload, 
    CodigoTecnico, 
    CodigoTecnicoPayload,
    Aplicacion,
    AplicacionPayload,
} from '../types';

// --- Funciones para CodigoReferencia (Padre) ---

export const getCodigosReferencia = async (includeInactive: boolean = false): Promise<CodigoReferencia[]> => {
    const response = await apiClient.get<CodigoReferencia[]>('/codigos-referencia', {
        params: { incluir_inactivos: includeInactive }
    });
    return response.data;
};

export const getCodigoReferenciaById = async (id: number): Promise<CodigoReferencia> => {
    const response = await apiClient.get<CodigoReferencia>(`/codigos-referencia/${id}`);
    return response.data;
};

export const createCodigoReferencia = async (data: CodigoReferenciaPayload): Promise<CodigoReferencia> => {
    const response = await apiClient.post<CodigoReferencia>('/codigos-referencia', data);
    return response.data;
};

export const updateCodigoReferencia = async (id: number, data: Partial<CodigoReferenciaPayload>): Promise<CodigoReferencia> => {
    const response = await apiClient.put<CodigoReferencia>(`/codigos-referencia/${id}`, data);
    return response.data;
};

export const activateCodigoReferencia = async (id: number): Promise<CodigoReferencia> => {
    const response = await apiClient.put<CodigoReferencia>(`/codigos-referencia/${id}/activate`);
    return response.data;
};

export const deactivateCodigoReferencia = async (id: number): Promise<CodigoReferencia> => {
    const response = await apiClient.put<CodigoReferencia>(`/codigos-referencia/${id}/deactivate`);
    return response.data;
};

// --- Funciones para CodigoTecnico (Hijo) ---

export const createCodigoTecnico = async (refId: number, data: Omit<CodigoTecnicoPayload, 'id_codigo_referencia'>): Promise<CodigoTecnico> => {
    const response = await apiClient.post<CodigoTecnico>(`/codigos-referencia/${refId}/codigos-tecnicos/`, data);
    return response.data;
};

export const updateCodigoTecnico = async (refId: number, tecId: number, data: Partial<Omit<CodigoTecnicoPayload, 'id_codigo_referencia'>>): Promise<CodigoTecnico> => {
    const response = await apiClient.put<CodigoTecnico>(`/codigos-referencia/${refId}/codigos-tecnicos/${tecId}`, data);
    return response.data;
};

export const deleteCodigoTecnico = async (refId: number, tecId: number): Promise<void> => {
    await apiClient.delete(`/codigos-referencia/${refId}/codigos-tecnicos/${tecId}`);
};

// --- Aplicaciones ---
export const addAplicacion = async (refId: number, payload: AplicacionPayload): Promise<Aplicacion> => {
    const body: any = { id_version_vehiculo: payload.id_version };
    const response = await apiClient.post<Aplicacion>(`/codigos-referencia/${refId}/aplicaciones`, body);
    return response.data;
};

export const deleteAplicacion = async (refId: number, id_version: number): Promise<void> => {
    await apiClient.delete(`/codigos-referencia/${refId}/aplicaciones/${id_version}`);
};
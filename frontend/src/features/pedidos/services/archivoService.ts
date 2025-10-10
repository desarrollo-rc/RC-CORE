// archivoService.ts

import apiClient from '../../../api/axios';

export interface ArchivoPDF {
    nombre_archivo: string;
    codigo_b2b: string;
    fecha_extraccion: string;
    tamaño_bytes: number;
    tamaño_mb: number;
    fecha_modificacion: string;
    ruta_relativa: string;
}

export interface ListaArchivosResponse {
    exito: boolean;
    mensaje: string;
    pdfs: ArchivoPDF[];
}

export interface DescargaArchivoResponse {
    exito: boolean;
    mensaje: string;
}

/**
 * Lista todos los PDFs extraídos de Gmail
 */
export const listarPDFsGmail = async (): Promise<ListaArchivosResponse> => {
    const response = await apiClient.get<ListaArchivosResponse>('/archivos/gmail/pdfs');
    return response.data;
};

/**
 * Descarga un PDF específico
 */
export const descargarPDFGmail = async (rutaRelativa: string): Promise<Blob> => {
    const response = await apiClient.get(`/archivos/gmail/pdfs/descargar/${rutaRelativa}`, {
        responseType: 'blob'
    });
    return response.data;
};

/**
 * Elimina un PDF específico
 */
export const eliminarPDFGmail = async (rutaRelativa: string): Promise<DescargaArchivoResponse> => {
    const response = await apiClient.delete<DescargaArchivoResponse>(`/archivos/gmail/pdfs/eliminar/${rutaRelativa}`);
    return response.data;
};

/**
 * Función helper para descargar un archivo blob
 */
export const descargarArchivo = (blob: Blob, nombreArchivo: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

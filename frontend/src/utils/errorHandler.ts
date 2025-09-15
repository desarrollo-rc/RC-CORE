// src/utils/errorHandler.ts
import { AxiosError } from 'axios';

/**
 * Extrae un mensaje de error legible por humanos desde un error de API.
 * Si no encuentra un mensaje específico del backend, devuelve uno por defecto.
 * @param error - El objeto de error, usualmente de un bloque catch.
 * @param defaultMessage - Un mensaje para mostrar si no se encuentra nada específico.
 * @returns Un string con el mensaje de error.
 */
export const getApiErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error instanceof AxiosError) {
        // Buscamos un mensaje de error en la respuesta del backend
        const apiError = error.response?.data?.error;
        if (typeof apiError === 'string') {
            return apiError;
        }

        // Podríamos añadir más lógica aquí para manejar otros formatos de error si es necesario
    }

    // Si no es un error de Axios o no tiene el formato esperado, devolvemos el mensaje por defecto.
    return defaultMessage;
};
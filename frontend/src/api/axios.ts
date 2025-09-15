// src/api/axios.ts
import axios from 'axios';
import { refreshToken } from './authService';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para inyectar el token JWT en el header
apiClient.interceptors.request.use((config) => {
    if (!config.url?.includes('/auth/refresh')) {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    (response) => response, // Si la respuesta es exitosa, no hagas nada
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no es una petición de reintento y no es el endpoint de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
  
            try {
                const { access_token } = await refreshToken();
                localStorage.setItem('authToken', access_token);
                // Actualizamos el header de la petición original y la reintentamos
                originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Si el refresh token falla, deslogueamos al usuario
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
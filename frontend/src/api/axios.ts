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
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response, // Si la respuesta es exitosa, no hagas nada
    async (error) => {
        const originalRequest = error.config;
        // Si el error es 401 y no es una petición de reintento
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Marca la petición para evitar bucles infinitos
  
            try {
                const { access_token } = await refreshToken();
                localStorage.setItem('authToken', access_token);
                apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
                originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
          
            // Reintenta la petición original con el nuevo token
            return apiClient(originalRequest);
            } catch (refreshError) {
                // Si el refresh token falla, desloguea al usuario
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login'; // Redirige al login
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
// src/api/authService.ts
import apiClient from './axios';
import type { UserCredentials, AuthResponse } from '../types/auth';

export const login = async (credentials: UserCredentials): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const refreshToken = async (): Promise<{ access_token: string }> => {
    try {
        const response = await apiClient.post('/auth/refresh');
        return response.data;
    } catch (error) {
        throw error;
    }
};
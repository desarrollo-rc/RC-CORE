// src/types/auth.ts

export interface UserCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    access_token: string;
    refresh_token: string;
}
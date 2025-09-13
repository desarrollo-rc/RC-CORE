// src/context/AuthContext.tsx
import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { login as apiLogin } from '../api/authService';
import { type UserCredentials } from '../types/auth';

// Define la estructura de los datos que compartiremos
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  logout: () => void;
}

// Creamos el Context con un valor inicial undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creamos el "Proveedor", el componente que contendrá toda la lógica
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al cargar la app, revisamos si ya existe un token en el Local Storage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    // Solo establecer el token si tenemos tanto el access token como el refresh token
    if (storedToken && storedRefreshToken) {
      setToken(storedToken);
    } else {
      // Si no tenemos ambos tokens, limpiar el localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: UserCredentials) => {
    const response = await apiLogin(credentials);
    localStorage.setItem('authToken', response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);
    setToken(response.access_token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
  };

  const value = {
    isAuthenticated: !!token,
    token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
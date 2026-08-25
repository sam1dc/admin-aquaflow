import axios from 'axios';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar el token de la sesión de Supabase
apiClient.interceptors.request.use(
  async (config) => {
    // Intentamos obtener la sesión actual directamente de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && session.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas (opcional)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Opcional: manejar expiración de token o logout automático si es necesario
      console.warn("No autorizado: ", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

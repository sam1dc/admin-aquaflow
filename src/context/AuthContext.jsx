import { createContext, useState, useEffect } from 'react';
import api from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('aquaflow_admin_token');
    const storedUser = localStorage.getItem('aquaflow_admin_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (identificador, password) => {
    try {
      const response = await api.post('/auth/login', { identificador, password });
      const { data } = response.data;

      if (data.rol !== 'administrador') {
        throw new Error('Acceso denegado. No tienes permisos de administrador.');
      }

      const { token: newToken, usuario } = data;

      setToken(newToken);
      setUser(usuario);

      localStorage.setItem('aquaflow_admin_token', newToken);
      localStorage.setItem('aquaflow_admin_user', JSON.stringify(usuario));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al iniciar sesión',
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aquaflow_admin_token');
    localStorage.removeItem('aquaflow_admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

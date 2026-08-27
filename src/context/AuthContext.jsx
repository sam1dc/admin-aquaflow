import { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión activa al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listener para cambios de auth (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar rol admin en los metadatos del token
      const role = data.user?.user_metadata?.role;
      if (role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. No tienes permisos de administrador.');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión',
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

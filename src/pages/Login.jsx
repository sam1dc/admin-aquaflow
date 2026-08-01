import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AquaFlowLogo } from '../components/ui/AquaFlowLogo';

export const Login = () => {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token } = useAuth();
  const navigate = useNavigate();

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(identificador, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="glass rounded-2xl w-full max-w-[420px] p-8 shadow-lg relative z-10">
        <div className="flex flex-col items-center mb-8">
          <AquaFlowLogo size="lg" className="mb-2" />
          <p className="text-text-muted text-sm mt-3">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {error && (
          <div className="bg-status-error/10 border border-status-error/30 text-status-error p-3 rounded-xl mb-6 flex items-center gap-2 text-sm animate-fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">
              Email o Teléfono
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="admin@aquaflow.com"
                className="!pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="!pl-11"
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
};

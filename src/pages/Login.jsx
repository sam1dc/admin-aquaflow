import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Login = () => {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, session } = useAuth();
  const navigate = useNavigate();

  // Si ya hay sesión, redirigir al dashboard
  if (session) {
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] px-6 z-10">
        <div className="glass-panel rounded-xl shadow-2xl p-10">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="AquaFlow Icon" className="h-20 w-auto object-contain drop-shadow-xl mb-3 hover:scale-105 transition-transform duration-300" />
            <h1 className="text-4xl font-black tracking-tight mb-3">
              <span className="text-white">AQUA</span>
              <span className="text-primary">FLOW</span>
            </h1>
            <div className="mt-1">
              <span className="text-xs font-bold px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 tracking-widest uppercase shadow-[0_0_15px_rgba(52,152,219,0.2)]">
                Panel de Administración
              </span>
            </div>
            <p className="text-on-surface-variant text-sm mt-5">Sistema de Gestión de Suministro</p>
          </div>

          {error && (
            <div className="bg-status-error/10 border border-status-error/30 text-status-error p-3 rounded-lg mb-6 flex items-center gap-2 text-sm animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium mb-2 text-on-surface-variant">
                Email o Teléfono
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="admin@aquaflow.com"
                  className="w-full bg-[#09121F] border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium mb-2 text-on-surface-variant">
                Contraseña
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#09121F] border border-outline-variant rounded-lg py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                <input type="checkbox" className="rounded border-outline-variant bg-[#09121F] text-primary focus:ring-offset-[#09121F]" /> Recordarme
              </label>
              <a href="#" className="text-primary hover:text-tertiary transition-colors">¿Olvidó su contraseña?</a>
            </div>

            <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-on-surface-variant/60">Acceso restringido a personal autorizado.</p>
      </div>
    </div>
  );
};
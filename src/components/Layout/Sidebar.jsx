import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AquaFlowLogo } from '../ui/AquaFlowLogo';
import { 
  LayoutDashboard, 
  Droplets, 
  Truck, 
  CreditCard, 
  Tag, 
  Gift, 
  AlertTriangle,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Pedidos', path: '/pedidos', icon: Droplets },
  { name: 'Cisterneros', path: '/cisterneros', icon: Truck },
  { name: 'Pagos', path: '/pagos', icon: CreditCard },
  { name: 'Tarifas', path: '/tarifas', icon: Tag },
  { name: 'Promociones', path: '/promociones', icon: Gift },
  { name: 'Incidencias', path: '/incidencias', icon: AlertTriangle },
  { name: 'Usuarios', path: '/usuarios', icon: Users },
];

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="fixed h-full w-[260px] left-0 top-0 bg-surface-container/80 backdrop-blur-xl border-r border-outline-variant/30 shadow-[15px_0_30px_-15px_rgba(52,152,219,0.1)] flex flex-col py-8 z-50 transition-all">
      <div className="px-6 mb-10">
        <AquaFlowLogo size="md" />
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'text-primary font-bold border-l-4 border-primary bg-primary/10' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright/50 font-medium'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-primary' : 'text-on-surface-variant'} />
              <span className="text-sm font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 space-y-1 pt-4 border-t border-outline-variant/30">
        <Link to="/ajustes" className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright/50 transition-all rounded-lg">
          <Settings size={18} />
          <span className="text-sm font-semibold">Ajustes</span>
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 text-status-error hover:bg-status-error/10 transition-all text-left rounded-lg cursor-pointer">
          <LogOut size={18} />
          <span className="text-sm font-semibold">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
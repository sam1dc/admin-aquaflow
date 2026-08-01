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
  Users
} from 'lucide-react';

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

  return (
    <aside className="w-[260px] bg-background-card border-r border-border flex flex-col h-screen fixed left-0 top-0 shadow-lg z-20">
      <div className="p-6 border-b border-border/40">
        <AquaFlowLogo size="md" />
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary font-semibold shadow-inner' 
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-main font-medium'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-primary' : 'text-text-muted'} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

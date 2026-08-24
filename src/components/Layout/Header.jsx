import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export const Header = () => {
  const { user, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Simulación: asumiendo que hay notificaciones sin leer.
  // En un caso real, esto vendría de un estado global o context de notificaciones.
  const hasUnread = true; 

  return (
    <header className="h-[70px] bg-background/80 backdrop-blur-lg border-b border-border flex items-center justify-end px-8 sticky top-0 z-40">
      <div className="flex items-center gap-6 relative">
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-text-muted hover:text-white transition-colors rounded-full hover:bg-white/5 cursor-pointer relative"
          >
            <Bell size={20} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-error rounded-full border-2 border-background animate-pulse"></span>
            )}
          </button>
          
          <NotificationDropdown 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />
        </div>

        <div className="w-px h-8 bg-border"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-background-card border border-border flex items-center justify-center text-text-secondary shadow-inner">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-main">{user?.nombre || 'Admin'}</span>
            <span className="text-xs text-text-muted">Administrador Principal</span>
          </div>
        </div>
      </div>
    </header>
  );
};

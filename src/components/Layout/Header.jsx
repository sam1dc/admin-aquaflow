import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-[70px] bg-background/80 backdrop-blur-lg border-b border-border flex items-center justify-end px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
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

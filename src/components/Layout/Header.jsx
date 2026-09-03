import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import api from '../../api/client';
import { io } from 'socket.io-client';
import { supabase } from '../../supabase';

export const Header = () => {
  const { user, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notificaciones');
      const mapped = (res.data.data || []).map(n => ({
        id: n.id_notificacion,
        type: n.tipo,
        title: n.titulo,
        message: n.mensaje,
        isRead: n.leida,
        date: n.fecha_creacion,
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    let socketInstance;
    let isMounted = true;
    
    const connectSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Solo creamos la conexión si el componente no se ha desmontado mientras esperábamos
      if (session?.access_token && isMounted) {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
        socketInstance = io(socketUrl, {
          auth: { token: session.access_token },
          transports: ['websocket', 'polling'], // Forzar WebSocket para eliminar el ruido de polling
        });

        socketInstance.on('notification:new', (notif) => {
          setNotifications(prev => [
            {
              id: notif.id_notificacion,
              type: notif.tipo,
              title: notif.titulo,
              message: notif.mensaje,
              isRead: notif.leida,
              date: notif.fecha_creacion,
            },
            ...prev
          ]);
        });
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  const hasUnread = notifications.some(n => !n.isRead); 

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
            notifications={notifications}
            setNotifications={setNotifications}
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

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Filter, Info, ShieldAlert, CreditCard, Droplet, FileText } from 'lucide-react';

const mockNotifications = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  type: ['incidencia', 'pago', 'licencia', 'reporte'][i % 4],
  title: ['Incidencia Reportada', 'Pago Confirmado', 'Licencia por Vencer', 'Nuevo Reporte'][i % 4],
  message: `Detalle de la notificación ${i + 1} de prueba.`,
  isRead: i > 3,
  date: new Date(Date.now() - i * 3600000).toISOString(),
}));

const getIcon = (type) => {
  switch(type) {
    case 'incidencia': return <ShieldAlert size={16} className="text-status-error" />;
    case 'pago': return <CreditCard size={16} className="text-status-success" />;
    case 'licencia': return <Droplet size={16} className="text-status-warning" />;
    default: return <FileText size={16} className="text-primary" />;
  }
};

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('todas');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filtered = notifications.filter(n => filter === 'todas' || n.type === filter);
  const visible = filtered.slice(0, page * itemsPerPage);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      if (visible.length < filtered.length) {
        setPage(p => p + 1);
      }
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute top-[60px] right-8 w-[380px] bg-background-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col animate-fade-in max-h-[500px]">
      <div className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
        <h3 className="font-bold text-text-main flex items-center gap-2">
          <Bell size={18} /> Notificaciones
        </h3>
        <button 
          onClick={markAllAsRead}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Check size={14} /> Marcar todas leídas
        </button>
      </div>

      <div className="flex gap-2 p-3 border-b border-border overflow-x-auto custom-scrollbar shrink-0">
        {['todas', 'incidencia', 'pago', 'licencia', 'reporte'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap cursor-pointer transition-colors ${
              filter === f ? 'bg-primary text-white shadow-md' : 'bg-background text-text-muted border border-border hover:text-white hover:bg-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div 
        className="overflow-y-auto custom-scrollbar flex-1 p-2"
        onScroll={handleScroll}
      >
        {visible.length === 0 ? (
          <div className="p-8 text-center text-text-muted flex flex-col items-center gap-2">
            <Info size={24} className="opacity-50" />
            <p className="text-sm">No hay notificaciones</p>
          </div>
        ) : (
          visible.map(n => (
            <div 
              key={n.id} 
              onClick={() => markAsRead(n.id)}
              className={`p-3 rounded-lg mb-2 flex gap-3 cursor-pointer transition-all hover:bg-white/5 ${n.isRead ? 'opacity-70' : 'bg-primary/5 border border-primary/20'}`}
            >
              <div className="mt-1 shrink-0 bg-background rounded-full p-2 border border-border shadow-inner">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-semibold truncate ${n.isRead ? 'text-text-secondary' : 'text-text-main'}`}>
                    {n.title}
                  </h4>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></span>}
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{n.message}</p>
                <span className="text-[10px] text-text-muted mt-2 block opacity-70">
                  {new Date(n.date).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

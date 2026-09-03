import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, ShieldAlert, CreditCard, Droplet, FileText, CheckCheck } from 'lucide-react';
import api from '../../api/client';

const typeConfig = {
  incidencia: { icon: ShieldAlert, bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', label: 'Incidencia' },
  pago:       { icon: CreditCard, bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', label: 'Pago' },
  licencia:   { icon: Droplet,    bg: 'rgba(234, 179, 8, 0.12)',  color: '#eab308', label: 'Licencia' },
  reporte:    { icon: FileText,   bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', label: 'Reporte' },
};

const getIconElement = (type) => {
  const cfg = typeConfig[type] || { icon: Bell, bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
  const Icon = cfg.icon;
  return (
    <div style={{ background: cfg.bg, color: cfg.color }}
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
      <Icon size={20} />
    </div>
  );
};

const filterItems = [
  { key: 'todas',      label: 'Todas',      icon: Bell },
  { key: 'incidencia', label: 'Incidencia',  icon: ShieldAlert },
  { key: 'pago',       label: 'Pago',        icon: CreditCard },
  { key: 'licencia',   label: 'Licencia',    icon: Droplet },
  { key: 'reporte',    label: 'Reporte',     icon: FileText },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days}d`;
}

export const NotificationDropdown = ({ isOpen, onClose, notifications, setNotifications }) => {
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
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      if (visible.length < filtered.length) {
        setPage(p => p + 1);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/admin/notificaciones/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  const markAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif?.isRead) return;

    try {
      await api.patch(`/admin/notificaciones/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef}
      className="absolute top-[60px] right-4 z-50 flex flex-col animate-fade-in"
      style={{
        width: '480px',
        maxHeight: '620px',
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 60%)',
      }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={20} color="white" />
            </div>
            <div>
              <h3 className="text-text-main font-bold text-base">Notificaciones</h3>
              <span className="text-text-muted text-xs">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
              </span>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors"
              style={{
                background: 'rgba(59,130,246,0.08)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <CheckCheck size={14} /> Marcar todas
            </button>
          )}
        </div>

        {/* Filters - flex wrap, no scroll */}
        <div className="flex flex-wrap gap-2">
          {filterItems.map(({ key, label, icon: FIcon }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className="cursor-pointer transition-all"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                border: filter === key ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
                background: filter === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: filter === key ? '#60a5fa' : 'var(--text-muted)',
              }}
            >
              <FIcon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      <div
        className="flex-1 custom-scrollbar"
        onScroll={handleScroll}
        style={{ overflowY: 'auto', padding: '8px 12px' }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div style={{
              background: 'rgba(148,163,184,0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <Info size={28} style={{ opacity: 0.4 }} />
            </div>
            <p className="text-sm font-medium" style={{ opacity: 0.6 }}>No hay notificaciones</p>
            <p className="text-xs mt-1" style={{ opacity: 0.4 }}>Las alertas nuevas aparecerán aquí</p>
          </div>
        ) : (
          visible.map(n => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className="cursor-pointer transition-all"
              style={{
                display: 'flex',
                gap: '14px',
                padding: '14px 12px',
                borderRadius: '12px',
                marginBottom: '4px',
                opacity: n.isRead ? 0.6 : 1,
                background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)',
                border: n.isRead ? '1px solid transparent' : '1px solid rgba(59,130,246,0.1)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)'}
            >
              {getIconElement(n.type)}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: n.isRead ? 'var(--text-secondary)' : 'var(--text-main)',
                    lineHeight: 1.3,
                  }}>
                    {n.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{
                      fontSize: '10.5px',
                      color: 'var(--text-muted)',
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                    }}>
                      {timeAgo(n.date)}
                    </span>
                    {!n.isRead && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        boxShadow: '0 0 6px rgba(59,130,246,0.5)',
                        display: 'block',
                      }} />
                    )}
                  </div>
                </div>
                <p style={{
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AlertTriangle, Check, Eye, User, Package, ExternalLink, ShieldAlert, X, MessageSquare, Send } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import api from '../api/client';

const tipoVariant = {
  'informacion_falsa': 'error',
  'comprobante_invalido': 'error',
  'cancelacion': 'warning',
  'demora': 'warning',
  'calidad': 'info',
  'otro': 'info',
};

const tipoLabel = {
  'informacion_falsa': 'Info. Falsa',
  'comprobante_invalido': 'Comprobante Inválido',
  'cancelacion': 'Cancelación',
  'demora': 'Demora',
  'calidad': 'Calidad',
  'otro': 'Otro',
};

// Mapeo para colores según el tipo de incidencia
const getSeverityColor = (tipo) => {
  const variant = tipoVariant[tipo] || 'info';
  if (variant === 'error') return 'text-status-error bg-status-error/10 border-status-error/20';
  if (variant === 'warning') return 'text-status-warning bg-status-warning/10 border-status-warning/20';
  return 'text-primary bg-primary/10 border-primary/20';
};

const getSeverityIcon = (tipo) => {
  const variant = tipoVariant[tipo] || 'info';
  if (variant === 'error') return <ShieldAlert size={24} className="text-status-error" />;
  if (variant === 'warning') return <AlertTriangle size={24} className="text-status-warning" />;
  return <AlertTriangle size={24} className="text-primary" />;
};

const getSeverityBadgeText = (tipo) => {
  const variant = tipoVariant[tipo] || 'info';
  if (variant === 'error') return 'URGENTE';
  if (variant === 'warning') return 'ADVERTENCIA';
  return 'INFO';
};

export const Incidencias = () => {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todas');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4500);
  };

  const fetchIncidencias = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/incidencias');
      setIncidencias(res.data.data || []);
    } catch (error) {
      console.error("Error fetching incidencias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidencias();
  }, []);

  const handleUpdateStatus = async (id, estatus_gestion) => {
    try {
      setActionLoading(id);
      const res = await api.patch(`/admin/incidencias/${id}/estado`, { estatus_gestion });
      showToast(res.data?.message || 'Incidencia actualizada', 'success');
      fetchIncidencias();
    } catch (error) {
      showToast(`Error: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedIncidencia) return;
    try {
      setIsSending(true);
      const res = await api.post(`/admin/incidencias/${selectedIncidencia.id_incidencia}/mensajes`, {
        mensaje: newMessage.trim(),
      });
      // Append the new message to the local state so it shows up immediately
      const updatedMessages = [...(selectedIncidencia.mensajes || []), res.data.data];
      const updatedIncidencia = { ...selectedIncidencia, mensajes: updatedMessages, estatus_gestion: 'En Revision' };
      setSelectedIncidencia(updatedIncidencia);
      // Update the main list
      setIncidencias(prev => prev.map(inc => inc.id_incidencia === updatedIncidencia.id_incidencia ? updatedIncidencia : inc));
      setNewMessage('');
    } catch (error) {
      showToast(`Error: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const statuses = ['Todas', 'Abierta', 'En Revision', 'Cerrada'];
  const filtered = filter === 'Todas' ? incidencias : incidencias.filter(i => i.estatus_gestion === filter);
  const activasCount = incidencias.filter(i => i.estatus_gestion !== 'Cerrada').length;

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Resolución de Incidencias</h2>
          <p className="text-text-muted text-sm mt-1">Gestione y resuelva problemas reportados en la plataforma.</p>
        </div>
        
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((estado) => {
            const isActive = filter === estado;
            return (
              <button
                key={estado}
                onClick={() => setFilter(estado)}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all outline-none ${
                  isActive
                    ? 'border border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(52,152,219,0.15)]'
                    : 'border border-border text-text-muted hover:border-primary/50 hover:text-text-main'
                }`}
              >
                {estado} {estado === 'Todas' && `(${incidencias.length})`}
                {estado === 'Abierta' && `(${incidencias.filter(i => i.estatus_gestion === 'Abierta').length})`}
                {estado === 'En Revision' && `(${incidencias.filter(i => i.estatus_gestion === 'En Revision').length})`}
                {estado === 'Cerrada' && `(${incidencias.filter(i => i.estatus_gestion === 'Cerrada').length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-text-muted glass-card rounded-xl">
          <AlertTriangle size={48} className="animate-pulse opacity-50 mb-4 text-primary" />
          <p className="animate-pulse font-medium">Cargando incidencias...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-text-muted glass-card rounded-xl">
          <div className="p-4 rounded-2xl bg-status-success/10 mb-4">
            <Check size={48} className="text-status-success opacity-60" />
          </div>
          <h3 className="text-xl font-semibold text-status-success mb-2">Todo en orden</h3>
          <p>No se encontraron incidencias con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((inc) => {
            const reportadoPor = inc.usuario;
            const pedido = inc.pedido;
            const severityClasses = getSeverityColor(inc.tipo);
            const isClosed = inc.estatus_gestion === 'Cerrada';

            return (
              <div 
                key={inc.id_incidencia} 
                className={`glass-card rounded-xl p-6 transition-all duration-300 flex flex-col gap-4 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(52,152,219,0.1)] cursor-pointer ${isClosed ? 'opacity-70' : ''}`}
                onClick={() => setSelectedIncidencia(inc)}
              >
                <div className="flex justify-between items-start border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(inc.tipo)}
                    <h3 className="text-lg font-bold text-text-main">
                      {tipoLabel[inc.tipo] || inc.tipo}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border tracking-wider ${severityClasses}`}>
                      {getSeverityBadgeText(inc.tipo)}
                    </span>
                    <Badge variant={isClosed ? 'success' : 'info'} className="text-[10px]">
                      {inc.estatus_gestion}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <p className="text-sm text-text-muted bg-background/50 p-3 rounded-lg border border-border/30">
                    {inc.descripcion || 'Sin descripción detallada.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-text-muted uppercase font-semibold tracking-wider mb-2">Reportado por</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-background-card border border-border overflow-hidden flex items-center justify-center">
                          <User size={16} className="text-text-muted" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-main truncate max-w-[120px]">
                            {reportadoPor?.nombre || 'Usuario'}
                          </span>
                          <span className="text-xs text-text-muted truncate max-w-[120px]">
                            {reportadoPor?.telefono || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-text-muted uppercase font-semibold tracking-wider mb-2">Orden Asociada</p>
                      {pedido ? (
                        <a href={`/pedidos?search=${pedido.id_pedido}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                          #{pedido.id_pedido.slice(0, 8).toUpperCase()}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-sm text-text-muted">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border/50">
                  {inc.estatus_gestion !== 'En Revision' && inc.estatus_gestion !== 'Cerrada' && (
                    <Button
                      variant="outline"
                      disabled={actionLoading === inc.id_incidencia}
                      onClick={() => handleUpdateStatus(inc.id_incidencia, 'En Revision')}
                      className="px-4 py-2 border-border text-text-main hover:border-primary hover:text-primary transition-all text-sm font-semibold"
                    >
                      En Revisión
                    </Button>
                  )}
                  {inc.estatus_gestion !== 'Cerrada' && (
                    <Button
                      disabled={actionLoading === inc.id_incidencia}
                      onClick={() => handleUpdateStatus(inc.id_incidencia, 'Cerrada')}
                      className="px-4 py-2 bg-primary text-white hover:bg-primary-dark hover:shadow-glow transition-all text-sm font-semibold"
                    >
                      Cerrar Incidencia
                    </Button>
                  )}
                  {isClosed && (
                    <span className="text-sm text-text-muted font-medium py-2">
                      Resuelta
                    </span>
                  )}
                  {!isClosed && (
                    <Button
                      variant="outline"
                      className="px-4 py-2 border-primary/50 text-primary hover:bg-primary/10 transition-all text-sm font-semibold flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncidencia(inc);
                      }}
                    >
                      <MessageSquare size={16} /> Responder
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notificación Personalizada */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
          toast.type === 'error' ? 'bg-status-error/10 border-status-error/30 text-status-error' : 'bg-status-success/10 border-status-success/30 text-status-success'
        }`}>
          <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-status-error/20' : 'bg-status-success/20'}`}>
            {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          </div>
          <div className="flex flex-col pr-4">
            <span className="font-bold text-sm">{toast.type === 'error' ? 'Error' : 'Operación Exitosa'}</span>
            <span className="text-sm opacity-90">{toast.message}</span>
          </div>
          <button 
            onClick={() => setToast({ ...toast, show: false })}
            className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity rounded-full hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Chat Modal */}
      {selectedIncidencia && (
        <Modal
          isOpen={!!selectedIncidencia}
          onClose={() => setSelectedIncidencia(null)}
          title={`Ticket: ${tipoLabel[selectedIncidencia.tipo] || selectedIncidencia.tipo}`}
          maxWidth="max-w-3xl"
        >
          <div className="flex flex-col h-[60vh]">
            {/* Header / Info */}
            <div className="flex flex-col gap-2 p-4 border-b border-border/50 bg-background/50">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 text-xs font-bold rounded border ${getSeverityColor(selectedIncidencia.tipo)}`}>
                  {getSeverityBadgeText(selectedIncidencia.tipo)}
                </span>
                <Badge variant={selectedIncidencia.estatus_gestion === 'Cerrada' ? 'success' : 'info'}>
                  {selectedIncidencia.estatus_gestion}
                </Badge>
              </div>
              {selectedIncidencia.pedido && (
                <p className="text-sm text-text-muted mt-2">
                  Asociado al Pedido <span className="font-semibold text-primary">#{selectedIncidencia.pedido.id_pedido.slice(0,8).toUpperCase()}</span>
                </p>
              )}
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Mensaje original de la incidencia */}
              <div className="flex flex-col max-w-[85%] self-start bg-background-card border border-border/50 rounded-2xl rounded-tl-sm p-4 relative shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-primary" />
                  <span className="text-xs font-bold text-text-main">{selectedIncidencia.usuario?.nombre} (Cliente)</span>
                </div>
                <p className="text-sm text-text-main">{selectedIncidencia.descripcion}</p>
                <span className="text-[10px] text-text-muted self-end mt-1">
                  {new Date(selectedIncidencia.pedido?.fecha_creacion || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {/* Historial de Respuestas */}
              {selectedIncidencia.mensajes?.map(msg => {
                const isAdmin = msg.remitente_rol === 'Admin';
                return (
                  <div key={msg.id_mensaje} className={`flex flex-col max-w-[85%] p-4 rounded-2xl shadow-sm relative ${isAdmin ? 'self-end bg-primary/20 border border-primary/30 rounded-tr-sm text-text-main' : 'self-start bg-background-card border border-border/50 rounded-tl-sm text-text-main'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {isAdmin ? <ShieldAlert size={14} className="text-primary" /> : <User size={14} className="text-primary" />}
                      <span className="text-xs font-bold opacity-80">{isAdmin ? 'Soporte (Tú)' : 'Cliente'}</span>
                    </div>
                    <p className="text-sm">{msg.mensaje}</p>
                    <span className="text-[10px] opacity-60 self-end mt-1">
                      {new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
            
            {/* Input Area */}
            {selectedIncidencia.estatus_gestion !== 'Cerrada' ? (
              <div className="p-4 border-t border-border/50 flex items-center gap-3 bg-background-card">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }}
                  placeholder="Escribe una respuesta al cliente..."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-text-main"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || isSending}
                  className="bg-primary hover:bg-primary-dark text-white rounded-xl w-12 h-12 flex items-center justify-center p-0"
                >
                  {isSending ? <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span> : <Send size={20} />}
                </Button>
              </div>
            ) : (
              <div className="p-4 border-t border-border/50 text-center bg-background/50">
                <p className="text-sm text-text-muted">Esta incidencia está cerrada. Para enviar mensajes, primero debes reabrirla.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  AlertTriangle, Check, Eye, User, Package, ExternalLink, ShieldAlert, 
  X, MessageSquare, Send, Clock, CheckCircle2, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  
  // Estado para modal / drawer de revisión y chat sin recargar la pantalla
  const [showRevisionChat, setShowRevisionChat] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchIncidencias = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/admin/incidencias');
      setIncidencias(res.data.data || []);
    } catch (error) {
      console.error("Error fetching incidencias:", error);
      toast.error("Error al cargar incidencias");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidencias(false);
  }, []);

  // Handler seguro para abrir revisión / chat previniendo recarga nativa
  const handleOpenRevision = (e, inc) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedIncidencia(inc);
    
    // Inicializar mensajes de chat contextual para la incidencia
    const initialMessages = [
      {
        id: 1,
        sender: inc.usuario?.nombre || 'Usuario',
        role: 'user',
        text: inc.descripcion || 'Reporte de incidencia iniciado.',
        time: new Date(inc.fecha_creacion || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 2,
        sender: 'Soporte AquaFlow',
        role: 'system',
        text: `Incidencia en estado [${inc.estatus_gestion}]. Canal de atención y resolución activo.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
    setChatMessages(initialMessages);
    setShowRevisionChat(true);
  };

  const handleSendMessage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now(),
      sender: 'Administrador (Tú)',
      role: 'admin',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const handleUpdateStatus = async (e, id, estatus_gestion) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      setActionLoading(id);
      const res = await api.patch(`/admin/incidencias/${id}/estado`, { estatus_gestion });
      toast.success(res.data?.message || `Incidencia marcada como ${estatus_gestion}`);
      
      // Actualización de estado local inmediata para evitar parpadeos de recarga
      setIncidencias(prev => prev.map(inc => 
        inc.id_incidencia === id ? { ...inc, estatus_gestion } : inc
      ));

      if (selectedIncidencia?.id_incidencia === id) {
        setSelectedIncidencia(prev => prev ? { ...prev, estatus_gestion } : null);
      }
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
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

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight flex items-center gap-3">
            Resolución de Incidencias
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 rounded-full text-sm font-semibold">
              {incidencias.length}
            </span>
          </h2>
          <p className="text-text-muted text-sm mt-1">Gestione y resuelva problemas reportados en la plataforma.</p>
        </div>
        
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((estado) => {
            const isActive = filter === estado;
            return (
              <button
                key={estado}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilter(estado); }}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all outline-none cursor-pointer ${
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
                    <Badge variant={isClosed ? 'success' : inc.estatus_gestion === 'En Revision' ? 'warning' : 'info'} className="text-[10px]">
                      {inc.estatus_gestion}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <p className="text-sm text-text-muted bg-background/50 p-3 rounded-lg border border-border/30 line-clamp-3">
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
                        <Link 
                          to={`/pedidos?search=${pedido.id_pedido}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                        >
                          #{pedido.id_pedido.slice(0, 8).toUpperCase()}
                          <ExternalLink size={14} />
                        </Link>
                      ) : (
                        <span className="text-sm text-text-muted">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 mt-2 pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleOpenRevision(e, inc)}
                    className="px-3 py-1.5 border-border text-text-muted hover:text-text-main hover:border-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={14} /> Revisar & Chat
                  </Button>

                  <div className="flex items-center gap-2">
                    {inc.estatus_gestion !== 'En Revision' && inc.estatus_gestion !== 'Cerrada' && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionLoading === inc.id_incidencia}
                        onClick={(e) => handleUpdateStatus(e, inc.id_incidencia, 'En Revision')}
                        className="px-3 py-1.5 border-border text-text-main hover:border-primary hover:text-primary transition-all text-xs font-semibold cursor-pointer"
                      >
                        En Revisión
                      </Button>
                    )}
                    {inc.estatus_gestion !== 'Cerrada' && (
                      <Button
                        type="button"
                        disabled={actionLoading === inc.id_incidencia}
                        onClick={(e) => handleUpdateStatus(e, inc.id_incidencia, 'Cerrada')}
                        className="px-3 py-1.5 bg-primary text-white hover:bg-primary-dark hover:shadow-glow transition-all text-xs font-semibold cursor-pointer"
                      >
                        Cerrar Incidencia
                      </Button>
                    )}
                    {isClosed && (
                      <span className="text-xs text-status-success font-semibold py-1.5 flex items-center gap-1">
                        <Check size={14} /> Resuelta
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Revisión y Chat Sin Recarga */}
      <Modal
        isOpen={showRevisionChat && !!selectedIncidencia}
        onClose={() => setShowRevisionChat(false)}
        title="Revisión de Incidencia y Canal de Chat"
        maxWidth="max-w-3xl"
      >
        {selectedIncidencia && (
          <div className="flex flex-col gap-4 mt-2">
            {/* Header info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border">
              <div className="flex items-center gap-3">
                {getSeverityIcon(selectedIncidencia.tipo)}
                <div>
                  <h4 className="text-base font-bold text-text-main">
                    {tipoLabel[selectedIncidencia.tipo] || selectedIncidencia.tipo}
                  </h4>
                  <p className="text-xs text-text-muted">
                    Reportado por <strong>{selectedIncidencia.usuario?.nombre}</strong> ({selectedIncidencia.usuario?.telefono || selectedIncidencia.usuario?.email || 'N/A'})
                  </p>
                </div>
              </div>
              <Badge variant={selectedIncidencia.estatus_gestion === 'Cerrada' ? 'success' : selectedIncidencia.estatus_gestion === 'En Revision' ? 'warning' : 'info'}>
                {selectedIncidencia.estatus_gestion}
              </Badge>
            </div>

            {/* Chat Box */}
            <div className="flex flex-col h-72 bg-background/80 rounded-xl border border-border overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.role === 'admin' 
                        ? 'self-end items-end' 
                        : msg.role === 'system'
                        ? 'self-center items-center max-w-[95%]'
                        : 'self-start items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-text-muted font-bold">{msg.sender}</span>
                      <span className="text-[9px] text-text-muted/70">{msg.time}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'admin'
                        ? 'bg-primary text-white rounded-tr-none'
                        : msg.role === 'system'
                        ? 'bg-background-card border border-border text-text-muted text-center italic py-1.5 px-4 rounded-full'
                        : 'bg-background-card border border-border text-text-main rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Mensaje */}
              <form onSubmit={handleSendMessage} className="p-2.5 bg-background-card border-t border-border flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe una respuesta o nota de seguimiento..."
                  className="flex-1 bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-text-main placeholder:text-text-muted focus:border-primary outline-none"
                />
                <button
                  type="submit"
                  className="p-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* Acciones de Estado dentro del Chat Modal */}
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                {selectedIncidencia.estatus_gestion !== 'En Revision' && selectedIncidencia.estatus_gestion !== 'Cerrada' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleUpdateStatus(e, selectedIncidencia.id_incidencia, 'En Revision')}
                    className="text-xs px-3 py-1.5"
                  >
                    Marcar En Revisión
                  </Button>
                )}
                {selectedIncidencia.estatus_gestion !== 'Cerrada' && (
                  <Button
                    type="button"
                    variant="success"
                    onClick={(e) => handleUpdateStatus(e, selectedIncidencia.id_incidencia, 'Cerrada')}
                    className="text-xs px-3 py-1.5"
                  >
                    Resolver y Cerrar
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowRevisionChat(false)}
                className="text-xs px-4 py-1.5"
              >
                Cerrar Ventana
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
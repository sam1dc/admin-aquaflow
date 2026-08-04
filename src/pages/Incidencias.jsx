import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle, Check, Eye, User, Package, ExternalLink, ShieldAlert, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
const PAGE_SIZE_OPTIONS = [10, 15, 20, 25];
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
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [selectedPedidoHistory, setSelectedPedidoHistory] = useState(null);

  const fetchIncidencias = async (page = 1, size = pageSize, currentFilter = filter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(size));
      if (currentFilter !== 'Todas') {
        params.append('estatus_gestion', currentFilter);
      }

      const res = await api.get(`/admin/incidencias?${params.toString()}`);
      setIncidencias(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination({ total: res.data.data?.length || 0, page: 1, limit: size, totalPages: 1 });
      }
    } catch (error) {
      console.error("Error fetching incidencias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidencias(1, pageSize, filter);
  }, [filter]);

  const handlePrevPage = () => {
    if (pagination.page > 1) fetchIncidencias(pagination.page - 1, pageSize, filter);
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) fetchIncidencias(pagination.page + 1, pageSize, filter);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchIncidencias(1, newSize, filter);
  };

  const handleUpdateStatus = async (id, estatus_gestion) => {
    try {
      setActionLoading(id);
      const res = await api.patch(`/admin/incidencias/${id}/estado`, { estatus_gestion });
      alert(res.data?.message || 'Incidencia actualizada');
      fetchIncidencias();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
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
                className={`glass-card rounded-xl p-6 transition-all duration-300 flex flex-col gap-4 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(52,152,219,0.1)] ${isClosed ? 'opacity-70' : ''}`}
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
                        <a href="/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                          #{pedido.id_pedido.slice(0, 8).toUpperCase()}
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-sm text-text-muted">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border/50 flex-wrap">
                  {pedido && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPedidoHistory(pedido)}
                      className="px-4 py-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/5 transition-all text-sm font-semibold flex items-center gap-2"
                    >
                      <Clock size={16} /> Ver Historial del Pedido
                    </Button>
                  )}
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {!loading && incidencias.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <label className="text-sm text-text-muted">Mostrar:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-2 rounded-xl glass-panel text-text-main text-sm font-semibold focus:border-primary/50 outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt} className="bg-background-card">{opt} por pág.</option>
              ))}
            </select>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl glass-panel text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                Pág. {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl glass-panel text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Historial de Pedido */}
      <Modal isOpen={!!selectedPedidoHistory} onClose={() => setSelectedPedidoHistory(null)} title="Historial del Pedido">
        {selectedPedidoHistory && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col mb-2">
              <span className="text-xs text-text-muted uppercase font-bold tracking-wider">ID Pedido</span>
              <span className="font-semibold text-text-main">{selectedPedidoHistory.id_pedido}</span>
            </div>
            
            {selectedPedidoHistory.estados_log && selectedPedidoHistory.estados_log.length > 0 ? (
              <div className="relative pl-4 border-l-2 border-primary/30 space-y-6">
                {selectedPedidoHistory.estados_log.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background-card"></div>
                    <p className="text-sm font-bold text-text-main">{log.estado}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(log.timestamp).toLocaleString('es-VE', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No hay historial registrado para este pedido.</p>
            )}
            
            <div className="flex justify-end pt-4 mt-2 border-t border-border/50">
              <Button variant="outline" onClick={() => setSelectedPedidoHistory(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
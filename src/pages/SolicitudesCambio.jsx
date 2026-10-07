import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Modal } from '../components/ui/Modal';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertTriangle,
  User,
  Truck,
  FileText,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const SolicitudesCambio = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstatus, setFilterEstatus] = useState('Pendiente'); // 'Pendiente' | 'Aprobado' | 'Rechazado' | 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/solicitudes-cambio?estatus=${filterEstatus}`);
      setSolicitudes(res.data.data || []);
    } catch (error) {
      console.error('Error al cargar solicitudes de cambio:', error);
      showToast('Error al cargar las solicitudes de cambio', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterEstatus]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenReview = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setMotivoRechazo('');
    setShowRejectInput(false);
    setModalOpen(true);
  };

  const handleResolve = async (aprobado) => {
    if (!selectedSolicitud) return;

    if (!aprobado && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!aprobado && showRejectInput && !motivoRechazo.trim()) {
      showToast('Ingresa un motivo para rechazar la solicitud', 'error');
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/admin/solicitudes-cambio/${selectedSolicitud.id_solicitud}`, {
        aprobado,
        motivo_rechazo: motivoRechazo.trim() || undefined,
      });

      showToast(
        aprobado
          ? '¡Solicitud aprobada! Los datos del usuario fueron actualizados.'
          : 'La solicitud de cambio fue rechazada.',
        aprobado ? 'success' : 'info'
      );
      setModalOpen(false);
      fetchSolicitudes();
    } catch (error) {
      console.error('Error al procesar solicitud:', error);
      const msg = error.response?.data?.error || 'Error al procesar la solicitud';
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredList = solicitudes.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const nombre = item.usuario?.nombre?.toLowerCase() || '';
    const email = item.usuario?.email?.toLowerCase() || '';
    const telefono = item.usuario?.telefono?.toLowerCase() || '';
    const tipo = item.tipo?.toLowerCase() || '';
    return (
      nombre.includes(searchLower) ||
      email.includes(searchLower) ||
      telefono.includes(searchLower) ||
      tipo.includes(searchLower)
    );
  });

  const countPending = solicitudes.filter((s) => s.estatus === 'Pendiente').length;

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-8">
      {/* Toast Notificación */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white font-medium transition-all ${
            toastMessage.type === 'error'
              ? 'bg-status-error border border-status-error/30'
              : toastMessage.type === 'info'
              ? 'bg-primary border border-primary/30'
              : 'bg-status-success border border-status-success/30'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle size={20} />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2 flex items-center gap-3">
            <UserCheck className="text-primary" size={32} />
            Solicitudes de Cambio de Datos
          </h2>
          <p className="text-text-muted">
            Revisa y aprueba modificaciones de perfil, vehículo y documentos solicitadas desde la app móvil.
          </p>
        </div>

        <button
          onClick={fetchSolicitudes}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-primary/50 text-text-muted hover:text-text-main transition-all font-medium text-sm self-start sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar Lista
        </button>
      </div>

      {/* Tabs y Búsqueda */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'Pendiente', label: 'Pendientes', count: filterEstatus === 'Pendiente' ? countPending : null },
            { id: 'Aprobado', label: 'Aprobadas' },
            { id: 'Rechazado', label: 'Rechazadas' },
            { id: 'all', label: 'Todas' },
          ].map((tab) => {
            const isActive = filterEstatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterEstatus(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-background/40 text-text-muted hover:text-text-main hover:bg-background/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-background/50 text-text-muted text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6">Fecha Solicitud</th>
                <th className="py-4 px-6">Estatus</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-text-muted">
                    <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-primary" />
                    Cargando solicitudes de cambio...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-text-muted">
                    <UserCheck size={36} className="mx-auto mb-2 opacity-30" />
                    No hay solicitudes de cambio {filterEstatus !== 'all' ? `en estado "${filterEstatus}"` : ''}.
                  </td>
                </tr>
              ) : (
                filteredList.map((sol) => {
                  const usuario = sol.usuario || {};
                  const isCisternero = !!usuario.cisternero;

                  return (
                    <tr
                      key={sol.id_solicitud}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      {/* Usuario */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {usuario.foto_url ? (
                            <img
                              src={usuario.foto_url}
                              alt={usuario.nombre}
                              className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                              {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-text-main group-hover:text-primary transition-colors">
                                {usuario.nombre || 'Usuario sin nombre'}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCisternero
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                }`}
                              >
                                {isCisternero ? 'Conductor' : 'Cliente'}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted">
                              {usuario.email} · {usuario.telefono}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-medium text-text-main">
                          {sol.tipo === 'Vehiculo' ? (
                            <Truck size={16} className="text-blue-400" />
                          ) : sol.tipo === 'Documentos' ? (
                            <FileText size={16} className="text-yellow-400" />
                          ) : (
                            <User size={16} className="text-primary" />
                          )}
                          <span>{sol.tipo}</span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="py-4 px-6 text-text-muted text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {new Date(sol.fecha_solicitud).toLocaleString('es-VE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Estatus */}
                      <td className="py-4 px-6">
                        {sol.estatus === 'Pendiente' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            Pendiente
                          </span>
                        )}
                        {sol.estatus === 'Aprobado' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-success/10 text-status-success border border-status-success/20">
                            <CheckCircle size={14} />
                            Aprobado
                          </span>
                        )}
                        {sol.estatus === 'Rechazado' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-error/10 text-status-error border border-status-error/20">
                            <XCircle size={14} />
                            Rechazado
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenReview(sol)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-all cursor-pointer"
                        >
                          <Eye size={15} />
                          {sol.estatus === 'Pendiente' ? 'Revisar / Aprobar' : 'Ver Detalles'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Revisión y Comparación */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Revisar Solicitud de Cambio de Datos"
        size="xl"
      >
        {selectedSolicitud && (
          <div className="flex flex-col gap-6 py-2">
            {/* Header del Usuario */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/60 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-lg">
                  {selectedSolicitud.usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-base">
                    {selectedSolicitud.usuario?.nombre}
                  </h4>
                  <p className="text-xs text-text-muted">
                    {selectedSolicitud.usuario?.email} · {selectedSolicitud.usuario?.telefono}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  Tipo: {selectedSolicitud.tipo}
                </span>
              </div>
            </div>

            {/* Motivo ingresado por el usuario */}
            {selectedSolicitud.motivo_solicitud && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-muted">
                <strong className="text-primary font-bold block mb-0.5">Nota del Usuario:</strong>
                "{selectedSolicitud.motivo_solicitud}"
              </div>
            )}

            {/* Comparación Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lado Izquierdo: Datos Anteriores */}
              <div className="p-4 rounded-xl bg-background/40 border border-border flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2 text-text-muted font-bold text-xs uppercase">
                  <User size={14} /> Datos Actuales (Originales)
                </div>
                <div className="space-y-2 text-xs">
                  {renderDataFields(selectedSolicitud.datos_anteriores || {})}
                </div>
              </div>

              {/* Lado Derecho: Datos Solicitados */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2 text-primary font-bold text-xs uppercase">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={14} /> Datos Solicitados (Nuevos)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">
                    Modificados
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {renderDataFields(selectedSolicitud.datos_solicitados || {}, true)}
                </div>
              </div>
            </div>

            {/* Si ya está resuelta, mostrar la nota de resolución */}
            {selectedSolicitud.estatus !== 'Pendiente' && (
              <div className={`p-4 rounded-xl border text-xs ${
                selectedSolicitud.estatus === 'Aprobado'
                  ? 'bg-status-success/10 border-status-success/20 text-status-success'
                  : 'bg-status-error/10 border-status-error/20 text-status-error'
              }`}>
                <p className="font-bold mb-1">
                  Solicitud {selectedSolicitud.estatus} el{' '}
                  {selectedSolicitud.fecha_resolucion
                    ? new Date(selectedSolicitud.fecha_resolucion).toLocaleString('es-VE')
                    : ''}
                </p>
                {selectedSolicitud.motivo_rechazo && (
                  <p>Motivo de rechazo: {selectedSolicitud.motivo_rechazo}</p>
                )}
              </div>
            )}

            {/* Input de motivo de rechazo si fue pulsado Rechazar */}
            {showRejectInput && selectedSolicitud.estatus === 'Pendiente' && (
              <div className="space-y-2 p-4 rounded-xl bg-status-error/10 border border-status-error/30 animate-fade-in">
                <label className="text-xs font-bold text-status-error block">
                  Indica el motivo de rechazo para el usuario:
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej: La foto de la licencia no es legible, vuelve a subirla..."
                  className="w-full bg-background border border-status-error/40 rounded-xl p-3 text-xs text-text-main outline-none focus:ring-1 focus:ring-status-error"
                  rows={2}
                />
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-main text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>

              {selectedSolicitud.estatus === 'Pendiente' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleResolve(false)}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-status-error/10 hover:bg-status-error text-status-error hover:text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle size={16} />
                    {showRejectInput ? 'Confirmar Rechazo' : 'Rechazar Solicitud'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResolve(true)}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-status-success text-white hover:bg-status-success/90 text-xs font-bold shadow-glow transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle size={16} />
                    {processing ? 'Aprobando...' : 'Aprobar e Inyectar Datos'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Componente auxiliar para renderizar pares clave-valor
const renderDataFields = (data, isHighlight = false) => {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-text-muted italic">Sin datos registrados</p>;
  }

  return Object.entries(data).map(([key, val]) => {
    if (key === 'vehiculo' && typeof val === 'object' && val !== null) {
      return (
        <div key={key} className="pt-2 border-t border-border/30">
          <p className="font-bold text-primary mb-1">Datos del Vehículo:</p>
          <div className="pl-2 space-y-1">
            <p><span className="text-text-muted">Marca / Modelo:</span> <strong>{val.marca} {val.modelo}</strong></p>
            <p><span className="text-text-muted">Placa:</span> <strong className="font-mono bg-background px-1.5 py-0.5 rounded">{val.placa}</strong></p>
            <p><span className="text-text-muted">Capacidad:</span> <strong>{val.capacidad_tanque} Litros</strong></p>
            {val.fotos_url && (
              <div className="mt-2">
                <span className="text-text-muted block mb-1">Foto del Vehículo:</span>
                <a href={val.fotos_url} target="_blank" rel="noreferrer" className="inline-block">
                  <img src={val.fotos_url} alt="Foto Vehículo" className="w-28 h-20 object-cover rounded-lg border border-border hover:scale-105 transition-transform" />
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
      return (
        <div key={key} className="py-1">
          <span className="text-text-muted capitalize block mb-1">{key.replace(/_/g, ' ')}:</span>
          <a href={val} target="_blank" rel="noreferrer" className="inline-block">
            <img src={val} alt={key} className="w-24 h-16 object-cover rounded-lg border border-border hover:scale-105 transition-transform" />
          </a>
        </div>
      );
    }

    return (
      <div key={key} className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
        <span className="text-text-muted capitalize">{key.replace(/_/g, ' ')}:</span>
        <strong className={isHighlight ? 'text-primary font-semibold' : 'text-text-main'}>
          {String(val || 'N/A')}
        </strong>
      </div>
    );
  });
};

import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Check, X, User, Truck, Phone, Mail, FileText, Badge as BadgeIcon, ChevronLeft, ChevronRight, Eye, Image, Clock, ShieldCheck } from 'lucide-react';
import api from '../api/client';

const PAGE_SIZE_OPTIONS = [10, 15, 20, 25];

export const Cisterneros = () => {
  const [cisterneros, setCisterneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null });
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);

  // Estado para rastrear qué documentos han sido validados por el administrador
  const [validatedDocs, setValidatedDocs] = useState({});

  // Modal de previsualización de documentos
  const [docPreview, setDocPreview] = useState({ isOpen: false, url: null, title: '', id: null, type: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4500);
  };

  const fetchCisterneros = async (page = 1, size = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(size));
      const res = await api.get(`/admin/cisterneros/pendientes?${params.toString()}`);
      setCisterneros(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      } else {
        setPagination({ total: res.data.data?.length || 0, page: 1, limit: size, totalPages: 1 });
      }
    } catch (error) {
      console.error("Error fetching cisterneros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCisterneros(1, pageSize);
  }, []);

  const handlePrevPage = () => {
    if (pagination.page > 1) fetchCisterneros(pagination.page - 1, pageSize);
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) fetchCisterneros(pagination.page + 1, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchCisterneros(1, newSize);
  };

  const handleValidation = async (id, aprobado, motivo = undefined) => {
    try {
      if (!aprobado && motivo === undefined) {
        setRejectModal({ isOpen: true, id });
        return;
      }

      setActionLoading(id);

      await api.patch(`/admin/cisterneros/${id}/validar`, { aprobado, motivo_rechazo: motivo });
      setCisterneros(prev => prev.filter(c => c.id_cisternero !== id));

      if (!aprobado) {
        setRejectModal({ isOpen: false, id: null });
        setMotivoRechazo('');
      }

      showToast(aprobado ? 'Conductor aprobado exitosamente' : 'Solicitud rechazada', aprobado ? 'success' : 'error');
    } catch (error) {
      showToast(`Error: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openDocPreview = (url, title, id, type) => {
    setDocPreview({ isOpen: true, url, title, id, type });
  };

  const markAsValidated = () => {
    if (docPreview.id && docPreview.type) {
      setValidatedDocs(prev => ({ ...prev, [`${docPreview.id}_${docPreview.type}`]: true }));
      showToast(`${docPreview.title} marcado como verificado`, 'success');
    }
    setDocPreview({ isOpen: false, url: null, title: '', id: null, type: null });
  };

  if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Cargando conductores pendientes...</div>;

  return (
    <div className="animate-fade-in relative z-0">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-3xl font-bold text-text-main mb-2 tracking-tight">Solicitudes Pendientes</h3>
          <p className="text-text-muted">Revisa y valida la documentación de los nuevos conductores y vehículos.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="warning">{cisterneros.length} Pendientes</Badge>
        </div>
      </div>

      {/* Bento Grid Layout for Pending Approvals */}
      {cisterneros.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-text-muted">
          <Truck size={56} className="mx-auto mb-4 opacity-30 text-primary" />
          <h3 className="text-lg font-semibold text-primary mb-1">Todo al día</h3>
          <p>No hay conductores pendientes de validación en este momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6 pb-8">
          {cisterneros.map((c) => {
            const isCedulaValid = validatedDocs[`${c.id_cisternero}_cedula`];
            const isLicenciaValid = validatedDocs[`${c.id_cisternero}_licencia`];

            return (
            <article key={c.id_cisternero} className="col-span-12 xl:col-span-6 glass-card p-0 overflow-hidden flex flex-col group">
              <div className="p-6 flex flex-col md:flex-row gap-6 flex-grow">
                {/* Profile Column */}
                <div className="flex flex-col items-center gap-2 md:w-1/3 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                  <div className="relative w-24 h-24 rounded-full p-1 border-2 border-primary/30 mb-2 overflow-hidden">
                    {c.usuario.foto_url ? (
                      <img src={c.usuario.foto_url} alt={c.usuario.nombre} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-background-card flex items-center justify-center text-primary">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xl text-text-main font-semibold text-center">{c.usuario.nombre}</h4>

                  <div className="w-full mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Phone size={16} className="text-primary" />
                      <span className="text-sm">{c.usuario.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Mail size={16} className="text-primary" />
                      <span className="text-sm truncate">{c.usuario.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <BadgeIcon size={16} className="text-primary" />
                      <span className="text-sm truncate">RIF: {c.rif_personal}</span>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:w-2/3 flex flex-col justify-between">
                  {/* Vehicle Details */}
                  <div>
                    <h5 className="text-xs text-primary font-semibold tracking-widest uppercase mb-4 flex items-center gap-2">
                      <Truck size={16} /> Detalles del Vehículo
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background p-3 rounded-lg border border-border/50">
                        <p className="text-xs font-medium text-text-muted mb-1">Marca / Modelo</p>
                        <p className="text-sm text-text-main">{c.vehiculo?.marca} {c.vehiculo?.modelo}</p>
                      </div>
                      <div className="bg-background p-3 rounded-lg border border-border/50">
                        <p className="text-xs font-medium text-text-muted mb-1">Placas</p>
                        <p className="text-sm text-text-main font-mono">{c.vehiculo?.placa}</p>
                      </div>
                      <div className="bg-background p-3 rounded-lg border border-border/50">
                        <p className="text-xs font-medium text-text-muted mb-1">Capacidad</p>
                        <p className="text-sm text-primary font-medium">{c.vehiculo?.capacidad_tanque} Lts</p>
                      </div>
                      <div className="bg-background p-3 rounded-lg border border-border/50 flex flex-col justify-center items-center">
                        {c.vehiculo?.fotos_url ? (
                          <button onClick={() => openDocPreview(c.vehiculo.fotos_url, 'Foto del Vehículo', c.id_cisternero, 'vehiculo')} className="text-xs text-primary hover:underline flex flex-col items-center gap-1 cursor-pointer">
                            <Image size={20} />
                            Ver Foto
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted text-center">Sin foto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents Preview */}
                  <div className="mt-6">
                    <h5 className="text-xs text-primary font-semibold tracking-widest uppercase mb-3 flex items-center gap-2">
                      <FileText size={16} /> Documentación Adjunta
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cédula / Documento de Identidad */}
                      <button
                        onClick={() => c.documento_identidad_url && openDocPreview(c.documento_identidad_url, 'Cédula / Documento de Identidad', c.id_cisternero, 'cedula')}
                        disabled={!c.documento_identidad_url}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all cursor-pointer group/doc ${
                          !c.documento_identidad_url ? 'border-border/50 bg-background/50 opacity-50 cursor-not-allowed' :
                          isCedulaValid
                            ? 'border-status-success/40 bg-status-success/5 hover:border-status-success hover:bg-status-success/10'
                            : 'border-status-warning/40 bg-status-warning/5 hover:border-status-warning hover:bg-status-warning/10 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        }`}
                      >
                        <div className="relative">
                          <BadgeIcon size={28} className={!c.documento_identidad_url ? 'text-text-muted' : isCedulaValid ? 'text-status-success' : 'text-status-warning group-hover/doc:scale-110 transition-transform'} />
                          <div className="absolute -top-1 -right-2">
                            {c.documento_identidad_url && (isCedulaValid ? <Check size={12} className="text-status-success" /> : <Clock size={12} className="text-status-warning" />)}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-text-main">Cédula</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          !c.documento_identidad_url ? 'bg-border/50 text-text-muted' :
                          isCedulaValid ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'
                        }`}>
                          {!c.documento_identidad_url ? 'No subida' : isCedulaValid ? 'Verificado' : '⏳ Pendiente'}
                        </span>
                        {c.documento_identidad_url && (
                          <span className="text-[10px] text-primary flex items-center gap-1 mt-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                            <Eye size={10} /> Click para ver
                          </span>
                        )}
                      </button>

                      {/* Licencia de Conducir */}
                      <button
                        onClick={() => c.licencia_documento_url && openDocPreview(c.licencia_documento_url, 'Licencia de Conducir', c.id_cisternero, 'licencia')}
                        disabled={!c.licencia_documento_url}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all cursor-pointer group/doc ${
                          !c.licencia_documento_url ? 'border-border/50 bg-background/50 opacity-50 cursor-not-allowed' :
                          isLicenciaValid
                            ? 'border-status-success/40 bg-status-success/5 hover:border-status-success hover:bg-status-success/10'
                            : 'border-status-warning/40 bg-status-warning/5 hover:border-status-warning hover:bg-status-warning/10 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        }`}
                      >
                        <div className="relative">
                          <FileText size={28} className={!c.licencia_documento_url ? 'text-text-muted' : isLicenciaValid ? 'text-status-success' : 'text-status-warning group-hover/doc:scale-110 transition-transform'} />
                          <div className="absolute -top-1 -right-2">
                            {c.licencia_documento_url && (isLicenciaValid ? <Check size={12} className="text-status-success" /> : <Clock size={12} className="text-status-warning" />)}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-text-main">Licencia</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          !c.licencia_documento_url ? 'bg-border/50 text-text-muted' :
                          isLicenciaValid ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'
                        }`}>
                          {!c.licencia_documento_url ? 'No subida' : isLicenciaValid ? 'Verificado' : '⏳ Pendiente'}
                        </span>
                        {c.licencia_documento_url && (
                          <span className="text-[10px] text-primary flex items-center gap-1 mt-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                            <Eye size={10} /> Click para ver
                          </span>
                        )}
                      </button>

                      {/* Número de Licencia (texto) */}
                      <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border/50 bg-background/50">
                        <ShieldCheck size={28} className="text-primary" />
                        <span className="text-xs font-bold text-text-main">N° Licencia</span>
                        <span className="text-[10px] text-text-muted truncate w-full text-center" title={c.licencia_conducir}>
                          {c.licencia_conducir}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-background-hover/30 p-4 border-t border-border flex justify-end gap-4 mt-auto">
                <button
                  disabled={actionLoading === c.id_cisternero}
                  onClick={() => handleValidation(c.id_cisternero, false)}
                  className="px-6 py-2 text-status-error bg-status-error/10 hover:bg-status-error/20 border border-status-error/30 transition-all rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <X size={16} />
                  Rechazar
                </button>
                <button
                  disabled={actionLoading === c.id_cisternero}
                  onClick={() => handleValidation(c.id_cisternero, true)}
                  className="px-6 py-2 rounded-lg bg-status-success text-white text-sm font-semibold hover:bg-status-success/90 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 ambient-glow"
                >
                  <Check size={16} />
                  Aprobar y Activar
                </button>
              </div>
            </article>
          )})}
        </div>
      )}

      {/* Modal para Rechazar Conductor */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, id: null })}
        title="Rechazar solicitud del conductor"
      >
        <div className="flex flex-col gap-4 mt-4">
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Motivo del rechazo..."
            className="w-full bg-background/50 border border-border rounded-xl p-3 text-sm text-text-main resize-none focus:border-status-error focus:ring-1 focus:ring-status-error outline-none"
            rows={4}
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <Button variant="secondary" onClick={() => setRejectModal({ isOpen: false, id: null })}>Cancelar</Button>
            <Button
              className="bg-status-error text-white hover:bg-status-error/80 transition-all rounded-lg cursor-pointer px-5 py-2.5 text-sm font-medium"
              onClick={() => handleValidation(rejectModal.id, false, motivoRechazo)}
              disabled={!motivoRechazo.trim() || actionLoading === rejectModal.id}
            >
              Confirmar rechazo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Previsualización de Documento */}
      <Modal isOpen={docPreview.isOpen} onClose={() => setDocPreview({ isOpen: false, url: null, title: '', id: null, type: null })} title={docPreview.title} maxWidth="max-w-5xl">
        <div className="flex flex-col items-center gap-4">
          {docPreview.url && (
            docPreview.url.toLowerCase().endsWith('.pdf') ? (
              <iframe src={docPreview.url} className="w-full h-[70vh] rounded-xl border border-border bg-background-card" title={docPreview.title} />
            ) : (
              <div className="w-full rounded-xl overflow-hidden border border-border bg-background/50 flex items-center justify-center min-h-[300px]">
                <img
                  src={docPreview.url}
                  alt={docPreview.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400/1e293b/94a3b8?text=Imagen+No+Disponible';
                  }}
                />
              </div>
            )
          )}
          <div className="flex gap-3 w-full justify-end pt-2 border-t border-border/50">
            <button
              onClick={markAsValidated}
              className="px-6 py-2 rounded-lg bg-status-success text-white text-sm font-semibold hover:bg-status-success/90 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] ambient-glow"
            >
              <Check size={18} /> Marcar como Validado
            </button>
            <Button variant="outline" onClick={() => setDocPreview({ isOpen: false, url: null, title: '', id: null, type: null })}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notificación */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
          toast.type === 'error' ? 'bg-status-error/10 border-status-error/30 text-status-error' : 'bg-status-success/10 border-status-success/30 text-status-success'
        }`}>
          <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-status-error/20' : 'bg-status-success/20'}`}>
            {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          </div>
          <div className="flex flex-col">
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
    </div>
  );
};
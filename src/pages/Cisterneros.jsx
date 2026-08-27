import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Check, X, User, Truck, Phone, Mail, Calendar, FileText, Badge as BadgeIcon, AlertCircle } from 'lucide-react';
import api from '../api/client';

export const Cisterneros = () => {
  const [cisterneros, setCisterneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null });
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const fetchCisterneros = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/cisterneros/pendientes');
      setCisterneros(res.data.data || []);
    } catch (error) {
      console.error("Error fetching cisterneros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCisterneros();
  }, []);

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
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
    }
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
          {cisterneros.map((c) => (
            <article key={c.id_cisternero} className="col-span-12 xl:col-span-6 glass-card p-0 overflow-hidden flex flex-col group">
              <div className="p-6 flex flex-col md:flex-row gap-6 flex-grow">
                {/* Profile Column */}
                <div className="flex flex-col items-center gap-2 md:w-1/3 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                  <div className="relative w-24 h-24 rounded-full p-1 border-2 border-primary/30 mb-2">
                    <div className="w-full h-full rounded-full bg-background-card flex items-center justify-center text-primary">
                      <User size={40} />
                    </div>
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
                          <a href={c.vehiculo.fotos_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex flex-col items-center gap-1">
                            <FileText size={20} />
                            Ver Foto
                          </a>
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
                    <div className="flex gap-3">
                      {/* This is a placeholder since the API only returns licencia_conducir as text, we can show it as a badge */}
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-status-success/30 bg-status-success/10 group relative">
                        <BadgeIcon size={24} className="text-status-success group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-text-main mt-1 text-center">Licencia</span>
                        <span className="text-[10px] text-text-muted truncate w-full text-center" title={c.licencia_conducir}>{c.licencia_conducir}</span>
                        <div className="absolute top-1 right-1"><Check size={12} className="text-status-success" /></div>
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
          ))}
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
              className="bg-status-error text-white hover:bg-status-error/80 transition-all rounded-lg cursor-pointer"
              onClick={() => handleValidation(rejectModal.id, false, motivoRechazo)}
              disabled={!motivoRechazo.trim() || actionLoading === rejectModal.id}
            >
              Confirmar rechazo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
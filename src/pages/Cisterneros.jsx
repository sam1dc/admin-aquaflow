import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Check, X, User, Truck, Phone, Mail, Calendar, FileText, Badge as BadgeIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const PAGE_SIZE_OPTIONS = [10, 15, 20, 25];

export const Cisterneros = () => {
  const [cisterneros, setCisterneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);

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

  const handleValidation = async (id, aprobado) => {
    try {
      setActionLoading(id);
      let motivo_rechazo = undefined;
      
      if (!aprobado) {
        motivo_rechazo = window.prompt('Indique el motivo del rechazo:');
        if (motivo_rechazo === null) return;
      }

      await api.patch(`/admin/cisterneros/${id}/validar`, { aprobado, motivo_rechazo });
      setCisterneros(prev => prev.filter(c => c.id_cisternero !== id));
      toast.success(aprobado ? 'Cisternero aprobado' : 'Cisternero rechazado');
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Cargando cisterneros pendientes...</div>;

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
          <p>No hay cisterneros pendientes de validación en este momento.</p>
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
                  <span className="px-2 py-1 rounded bg-background border border-border text-text-muted text-xs font-semibold">
                    ID: {c.id_cisternero}
                  </span>
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
                  className="px-6 py-2 rounded-lg border border-status-error text-status-error text-sm font-semibold hover:bg-status-error/10 transition-colors flex items-center gap-2 disabled:opacity-50"
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

      {/* Paginación */}
      {!loading && cisterneros.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 mb-8">
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
    </div>
  );
};
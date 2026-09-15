import React, { useEffect, useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { MapPin, Plus, Pencil, Trash2, Droplets, Eye, EyeOff, Search, RefreshCw } from 'lucide-react';
import api from '../api/client';

export const Pozos = () => {
  const [pozos, setPozos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPozo, setEditingPozo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, nombre: '' });
  const [deleteResult, setDeleteResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActivo, setFilterActivo] = useState('todos');

  const [form, setForm] = useState({
    nombre: '',
    ubicacion: '',
    latitud: '',
    longitud: '',
    observaciones: '',
    activo: true,
  });

  const fetchPozos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/pozos');
      setPozos(res.data.data || []);
    } catch (error) {
      console.error('Error fetching pozos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPozos();
  }, []);

  const handleOpenCreate = () => {
    setEditingPozo(null);
    setForm({
      nombre: '',
      ubicacion: '',
      latitud: '',
      longitud: '',
      observaciones: '',
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pozo) => {
    setEditingPozo(pozo);
    setForm({
      nombre: pozo.nombre,
      ubicacion: pozo.ubicacion,
      latitud: pozo.latitud,
      longitud: pozo.longitud,
      observaciones: pozo.observaciones || '',
      activo: pozo.activo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, nombre, confirmed = false) => {
    if (!confirmed) {
      setDeleteResult(null);
      setDeleteModal({ isOpen: true, id, nombre });
      return;
    }

    try {
      const res = await api.delete(`/admin/pozos/${id}`);
      const wasDeactivated = res.data?.data?.activo === false;
      setDeleteResult({
        type: wasDeactivated ? 'deactivated' : 'deleted',
        message: wasDeactivated
          ? 'Este pozo tiene registros asociados y no puede eliminarse. Fue marcado como Inactivo.'
          : 'El pozo fue eliminado permanentemente.',
      });
      fetchPozos();
    } catch (error) {
      setDeleteResult({
        type: 'error',
        message: error.response?.data?.error || 'Error al eliminar el pozo.',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.ubicacion || !form.latitud || !form.longitud) return;

    try {
      setSubmitting(true);
      const payload = {
        nombre: form.nombre,
        ubicacion: form.ubicacion,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        observaciones: form.observaciones || null,
        ...(editingPozo && { activo: Boolean(form.activo) }),
      };

      if (editingPozo) {
        await api.put(`/admin/pozos/${editingPozo.id_pozo}`, payload);
      } else {
        await api.post('/admin/pozos', payload);
      }
      setIsModalOpen(false);
      fetchPozos();
    } catch (error) {
      alert(`Error al guardar pozo: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado local
  const filteredPozos = pozos.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ubicacion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchActivo =
      filterActivo === 'todos' ||
      (filterActivo === 'activos' && p.activo) ||
      (filterActivo === 'inactivos' && !p.activo);
    return matchSearch && matchActivo;
  });

  const totalActivos = pozos.filter((p) => p.activo).length;
  const totalInactivos = pozos.filter((p) => !p.activo).length;

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Stats Cards */}
        <div className="lg:col-span-4 grid grid-cols-3 gap-3">
          {/* Total */}
          <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
            <Droplets size={20} className="text-primary mb-1 relative z-10" />
            <span className="text-2xl font-bold text-text-main relative z-10">{pozos.length}</span>
            <span className="text-[11px] text-text-muted font-medium relative z-10">Total</span>
          </div>
          {/* Activos */}
          <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-status-success/50 transition-colors">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-status-success/10 rounded-full blur-2xl group-hover:bg-status-success/20 transition-all"></div>
            <Eye size={20} className="text-status-success mb-1 relative z-10" />
            <span className="text-2xl font-bold text-text-main relative z-10">{totalActivos}</span>
            <span className="text-[11px] text-text-muted font-medium relative z-10">Activos</span>
          </div>
          {/* Inactivos */}
          <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-text-muted/50 transition-colors">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-text-muted/10 rounded-full blur-2xl group-hover:bg-text-muted/20 transition-all"></div>
            <EyeOff size={20} className="text-text-muted mb-1 relative z-10" />
            <span className="text-2xl font-bold text-text-main relative z-10">{totalInactivos}</span>
            <span className="text-[11px] text-text-muted font-medium relative z-10">Inactivos</span>
          </div>
        </div>

        {/* Title & Actions */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-2">
          <div>
            <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2">Fuentes de Abastecimiento</h2>
            <p className="text-text-muted">Gestiona los pozos de agua que abastecen a los cisterneros. Se muestran en el mapa de la app.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark hover:shadow-[0_0_15px_rgba(52,152,219,0.3)] transition-all flex items-center justify-center gap-2 ambient-glow whitespace-nowrap"
          >
            <Plus size={18} /> Nuevo Pozo
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background-card border border-border rounded-xl py-3 pl-12 pr-4 text-text-main text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['todos', 'activos', 'inactivos'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterActivo(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                filterActivo === f
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-background-card border border-border text-text-muted hover:text-text-main hover:border-primary/30'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={fetchPozos}
            className="p-2.5 rounded-xl bg-background-card border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all"
            title="Recargar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-background/30 rounded-t-xl">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <MapPin className="text-primary" size={24} /> Pozos Registrados
          </h2>
          <span className="text-sm text-text-muted">
            {filteredPozos.length} de {pozos.length} pozo{pozos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center p-16 text-text-muted animate-pulse">Cargando pozos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-background/20 text-sm font-semibold text-text-muted">
                  <th className="p-4 whitespace-nowrap">Pozo</th>
                  <th className="p-4 whitespace-nowrap">Ubicación</th>
                  <th className="p-4 whitespace-nowrap">Coordenadas</th>
                  <th className="p-4 whitespace-nowrap">Estado</th>
                  <th className="p-4 whitespace-nowrap max-w-[200px]">Observaciones</th>
                  <th className="p-4 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredPozos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-16 text-text-muted">
                      <MapPin size={48} className="mx-auto mb-4 opacity-30 text-primary" />
                      {searchQuery || filterActivo !== 'todos'
                        ? 'No se encontraron pozos con estos filtros.'
                        : 'No hay pozos registrados. Crea uno para comenzar.'}
                    </td>
                  </tr>
                ) : (
                  filteredPozos.map((pozo) => (
                    <tr key={pozo.id_pozo} className="border-b border-border/30 hover:bg-white/5 transition-colors group">
                      <td className="p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${pozo.activo ? 'bg-primary/10 text-primary' : 'bg-text-muted/10 text-text-muted'}`}>
                          <MapPin size={16} />
                        </div>
                        <span className="text-text-main font-semibold">{pozo.nombre}</span>
                      </td>
                      <td className="p-4 text-text-secondary">{pozo.ubicacion}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-main font-mono text-xs">{pozo.latitud.toFixed(5)}°</span>
                          <span className="text-text-muted font-mono text-xs">{pozo.longitud.toFixed(5)}°</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {pozo.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-success/10 text-status-success font-semibold text-xs border border-status-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background text-text-muted font-semibold text-xs border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-4 max-w-[200px]">
                        <span className="text-text-muted text-xs line-clamp-2" title={pozo.observaciones || ''}>
                          {pozo.observaciones || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(pozo)}
                            className="p-2 text-text-muted hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(pozo.id_pozo, pozo.nombre)}
                            className="p-2 text-text-muted hover:text-status-error transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPozo ? 'Editar Pozo' : 'Nuevo Pozo'}
        maxWidth="max-w-[560px]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-muted block">Nombre del Pozo</label>
            <div className="relative">
              <Droplets size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Pozo del Negro"
                className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-muted block">Ubicación / Zona</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                placeholder="Ej. La Armonía, Upata"
                className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>

          {/* Coordenadas (lat / lng) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-muted block">Latitud</label>
              <input
                type="number"
                step="any"
                value={form.latitud}
                onChange={(e) => setForm({ ...form, latitud: e.target.value })}
                placeholder="Ej. 8.0075"
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-text-main font-mono text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-muted block">Longitud</label>
              <input
                type="number"
                step="any"
                value={form.longitud}
                onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                placeholder="Ej. -62.4111"
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-text-main font-mono text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>

          {/* Preview de coordenadas */}
          {form.latitud && form.longitud && (
            <div className="bg-background-card/50 rounded-xl p-4 border border-border/50 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
              <label className="text-xs text-text-muted font-bold uppercase tracking-wider block">Vista Previa de Ubicación</label>
              <div className="flex items-center gap-2 mt-2">
                <MapPin size={16} className="text-primary" />
                <span className="text-sm text-text-main font-mono">
                  {Number(form.latitud).toFixed(5)}°, {Number(form.longitud).toFixed(5)}°
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${form.latitud},${form.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary-dark mt-2 inline-block"
              >
                Ver en Google Maps ↗
              </a>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-muted block">Observaciones (opcional)</label>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el pozo..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-text-main text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none resize-none"
            />
          </div>

          {/* Toggle Activo (solo en edición) */}
          {editingPozo && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-muted">Estado Activo</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-background border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:shadow-glow hover:bg-primary-dark transition-all"
            >
              {submitting ? 'Guardando...' : editingPozo ? 'Guardar Cambios' : 'Crear Pozo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => { setDeleteModal({ isOpen: false, id: null, nombre: '' }); setDeleteResult(null); }}
        title={deleteResult ? (deleteResult.type === 'error' ? 'Error' : 'Operación completada') : 'Eliminar Pozo'}
      >
        <div className="flex flex-col gap-4 mt-4">
          {!deleteResult ? (
            <>
              <p className="text-sm text-text-muted">
                ¿Confirmas que deseas eliminar el pozo <strong className="text-text-main">"{deleteModal.nombre}"</strong>?
              </p>
              <div className="text-xs text-text-muted/70 bg-background/60 rounded-xl p-3 border border-border/40 space-y-1">
                <p>✅ <strong>Si no tiene registros asociados:</strong> se eliminará permanentemente.</p>
                <p>⚠️ <strong>Si tiene registros asociados:</strong> solo se marcará como Inactivo (no aparecerá en la app pero queda en el historial).</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button variant="secondary" onClick={() => { setDeleteModal({ isOpen: false, id: null, nombre: '' }); setDeleteResult(null); }}>Cancelar</Button>
                <Button variant="danger" onClick={() => handleDelete(deleteModal.id, deleteModal.nombre, true)}>Confirmar</Button>
              </div>
            </>
          ) : (
            <>
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                deleteResult.type === 'deleted'   ? 'bg-status-success/10 border-status-success/20 text-status-success' :
                deleteResult.type === 'deactivated' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                'bg-status-error/10 border-status-error/20 text-status-error'
              }`}>
                <span className="text-xl shrink-0">
                  {deleteResult.type === 'deleted' ? '🗑️' : deleteResult.type === 'deactivated' ? '⚠️' : '❌'}
                </span>
                <p className="text-sm">{deleteResult.message}</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => { setDeleteModal({ isOpen: false, id: null, nombre: '' }); setDeleteResult(null); }}>Cerrar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

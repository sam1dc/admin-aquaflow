import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pencil, Plus, Tag, RefreshCw, DollarSign, Coins, Trash2, Droplet, List, Download } from 'lucide-react';
import api from '../api/client';
import { getBcvRate } from '../api/bcv';

export const Tarifas = () => {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bcvData, setBcvData] = useState({ rate: 0, fechaActualizacion: '', fuente: '' });
  const [bcvLoading, setBcvLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState(null);
  const [form, setForm] = useState({ volumen_litros: '', precio_base: '', activo: true });
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const { user } = useAuth();
  const id_admin = user?.user_metadata?.id_usuario;

  const fetchBcv = async () => {
    setBcvLoading(true);
    const data = await getBcvRate();
    setBcvData(data);
    setBcvLoading(false);
  };

  const fetchTarifas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tarifas');
      setTarifas(res.data.data || []);
    } catch (error) {
      console.error("Error fetching tarifas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarifas();
    fetchBcv();
  }, []);

  const handleOpenCreate = () => {
    setEditingTarifa(null);
    setForm({ volumen_litros: '', precio_base: '', activo: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tarifa) => {
    setEditingTarifa(tarifa);
    setForm({
      volumen_litros: tarifa.volumen_litros,
      precio_base: tarifa.precio_base,
      activo: tarifa.activo ?? true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id_tarifa, confirmed = false) => {
    if (!confirmed) {
      setDeleteModal({ isOpen: true, id: id_tarifa });
      return;
    }

    try {
      const res = await api.delete(`/admin/tarifas/${id_tarifa}`);
      alert(res.data?.message || 'Tarifa eliminada exitosamente');
      fetchTarifas();
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      alert(`Error al eliminar tarifa: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.volumen_litros || !form.precio_base) return;

    try {
      setSubmitting(true);
      if (editingTarifa) {
        await api.put(`/admin/tarifas/${editingTarifa.id_tarifa}`, {
          volumen_litros: Number(form.volumen_litros),
          precio_base: Number(form.precio_base),
          activo: Boolean(form.activo),
        });
      } else {
        await api.post('/admin/tarifas', {
          id_admin,
          volumen_litros: Number(form.volumen_litros),
          precio_base: Number(form.precio_base),
        });
      }
      setIsModalOpen(false);
      fetchTarifas();
    } catch (error) {
      alert(`Error al guardar tarifa: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedBs = (form.precio_base && bcvData.rate)
    ? (Number(form.precio_base) * bcvData.rate).toFixed(2)
    : '0.00';

  const getVolumeIcon = (volumen) => {
    // Escala arbitraria de colores basados en el volumen
    if (volumen <= 1000) return 'bg-primary/10 text-primary';
    if (volumen <= 5000) return 'bg-status-location/10 text-status-location';
    return 'bg-status-success/10 text-status-success';
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-8">
      {/* Top Section: BCV & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* BCV Live Rate Widget */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-text-main">Tasa BCV Oficial</h3>
              <p className="text-xs text-text-muted mt-1">Fuente: {bcvData.fuente || 'DolarApi'}</p>
            </div>
            <button
              onClick={fetchBcv}
              className="text-primary hover:text-primary-dark transition-colors p-2 rounded-full hover:bg-primary/10"
              title="Recargar"
            >
              <RefreshCw size={20} className={bcvLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex items-end gap-2 relative z-10">
            <span className="text-4xl font-bold text-primary tracking-tight">
              {bcvLoading ? '---' : bcvData.rate.toFixed(2)}
            </span>
            <span className="text-lg text-text-muted mb-1 font-medium">Bs / USD</span>
          </div>
        </div>

        {/* Header & Nueva Tarifa Button */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-2">
          <div>
            <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2">Gestión de Tarifas</h2>
            <p className="text-text-muted">Configura los precios del agua en dólares (USD) y convierte automáticamente a Bolívares.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark hover:shadow-[0_0_15px_rgba(52,152,219,0.3)] transition-all flex items-center justify-center gap-2 ambient-glow whitespace-nowrap"
          >
            <Plus size={18} /> Nueva Tarifa
          </button>
        </div>
      </div>

      {/* Rates Table */}
      <div className="glass-card rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-background/30 rounded-t-xl">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <List className="text-primary" size={24} /> Gestión de Tarifas por Volumen
          </h2>
        </div>

        {loading ? (
          <div className="text-center p-16 text-text-muted animate-pulse">Cargando tarifas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-background/20 text-sm font-semibold text-text-muted">
                  <th className="p-4 whitespace-nowrap">Volumen</th>
                  <th className="p-4 whitespace-nowrap">Precio Base (USD)</th>
                  <th className="p-4 whitespace-nowrap">Precio Calculado (Bs)</th>
                  <th className="p-4 whitespace-nowrap">Estado</th>
                  <th className="p-4 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {tarifas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-16 text-text-muted">
                      <Tag size={48} className="mx-auto mb-4 opacity-30 text-primary" />
                      No hay tarifas registradas. Crea una para comenzar.
                    </td>
                  </tr>
                ) : (
                  tarifas.map((t) => {
                    const precioUSD = Number(t.precio_base);
                    const precioBs = (precioUSD * (bcvData.rate || 1)).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                    const iconColor = getVolumeIcon(t.volumen_litros);

                    return (
                      <tr key={t.id_tarifa} className="border-b border-border/30 hover:bg-white/5 transition-colors group">
                        <td className="p-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                            <Droplet size={16} />
                          </div>
                          <span className="text-text-main font-semibold text-base">{t.volumen_litros.toLocaleString()} Lts</span>
                        </td>
                        <td className="p-4 text-text-main font-medium">
                          $ {precioUSD.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="text-text-main font-semibold">Bs {precioBs}</span>
                          <span className="text-text-muted text-[11px] ml-1.5">(x{bcvData.rate.toFixed(2)})</span>
                        </td>
                        <td className="p-4">
                          {t.activo ? (
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
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="p-2 text-text-muted hover:text-primary transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id_tarifa)}
                              className="p-2 text-text-muted hover:text-status-error transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal (Inline redesign) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTarifa ? 'Configurar Tarifa' : 'Nueva Tarifa'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-muted block">Volumen (Litros)</label>
            <div className="relative">
              <Droplet size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                value={form.volumen_litros}
                onChange={e => setForm({ ...form, volumen_litros: e.target.value })}
                placeholder="Ej. 1000"
                className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-muted flex justify-between">
              <span>Precio Base (USD)</span>
            </label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.01"
                value={form.precio_base}
                onChange={e => setForm({ ...form, precio_base: e.target.value })}
                placeholder="0.00"
                className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Vista previa de conversión en Bolívares */}
          <div className="bg-background-card/50 rounded-xl p-4 border border-border/50 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
            <label className="text-xs text-text-muted font-bold uppercase tracking-wider block">Equivalente Estimado (Bs)</label>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-2xl font-bold text-primary">
                {Number(calculatedBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-text-muted mb-0.5 font-medium">VES</span>
            </div>
            <p className="text-xs text-text-muted/70 mt-2 flex items-center gap-1">
              Basado en tasa BCV actual ({bcvData.rate.toFixed(2)})
            </p>
          </div>

          {editingTarifa && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-muted">Estado Activo</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-background border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          )}

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
              {submitting ? 'Guardando...' : 'Guardar Tarifa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Eliminar Tarifa */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        title="Eliminar Tarifa"
      >
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-sm text-text-muted">
            ¿Estás seguro de que deseas eliminar esta tarifa? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false, id: null })}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => handleDelete(deleteModal.id, true)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
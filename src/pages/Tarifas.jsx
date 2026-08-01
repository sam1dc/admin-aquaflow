import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pencil, Plus, Tag, RefreshCw, DollarSign, Coins, Trash2 } from 'lucide-react';
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

  const user = JSON.parse(localStorage.getItem('aquaflow_admin_user') || '{}');
  const id_admin = user.administrador?.id_admin || user.id_usuario;

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

  const handleDelete = async (id_tarifa) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarifa?')) {
      return;
    }

    try {
      const res = await api.delete(`/admin/tarifas/${id_tarifa}`);
      alert(res.data?.message || 'Tarifa eliminada exitosamente');
      fetchTarifas();
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Tasa BCV Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Gestión de Tarifas</h2>
          <p className="text-text-muted text-sm mt-1">Configura los precios del agua en dólares (USD) y convierte automáticamente a Bolívares (BCV).</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Card indicador de Tasa BCV */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-card border border-border shadow-md">
            <div className="p-2 rounded-lg bg-status-success/10 text-status-success">
              <Coins size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted font-medium">Tasa BCV Oficial:</span>
                <span className="text-xs font-bold text-status-success">
                  {bcvLoading ? 'Cargando...' : `Bs. ${bcvData.rate.toFixed(2)} / USD`}
                </span>
              </div>
              <span className="text-[10px] text-text-muted block">
                {bcvData.fuente} • Actualizado en vivo
              </span>
            </div>
            <button 
              onClick={fetchBcv} 
              title="Recargar Tasa BCV"
              className="text-text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer ml-1"
            >
              <RefreshCw size={14} className={bcvLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus size={18} /> Nueva Tarifa
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="text-center p-8 text-text-muted animate-pulse">Cargando tarifas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3.5 px-4 text-sm font-medium text-text-muted">Volumen (Litros)</th>
                  <th className="py-3.5 px-4 text-sm font-medium text-text-muted">Precio ($ USD)</th>
                  <th className="py-3.5 px-4 text-sm font-medium text-text-muted">Precio (Bs BCV)</th>
                  <th className="py-3.5 px-4 text-sm font-medium text-text-muted">Estado</th>
                  <th className="py-3.5 px-4 text-sm font-medium text-text-muted text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tarifas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-text-muted">
                      <Tag size={40} className="mx-auto mb-2 opacity-30" />
                      No hay tarifas registradas
                    </td>
                  </tr>
                ) : (
                  tarifas.map((t) => {
                    const precioUSD = Number(t.precio_base);
                    const precioBs = (precioUSD * (bcvData.rate || 1)).toLocaleString('es-VE', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    });

                    return (
                      <tr key={t.id_tarifa} className="border-b border-border hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-text-main">
                          {t.volumen_litros.toLocaleString()} L
                        </td>
                        <td className="py-3.5 px-4 text-primary font-bold">
                          $ {precioUSD.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-status-success font-semibold">
                          Bs. {precioBs}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={t.activo ? 'success' : 'error'}>{t.activo ? 'Activa' : 'Inactiva'}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleOpenEdit(t)}
                              className="inline-flex items-center gap-1.5"
                            >
                              <Pencil size={14} /> Editar
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={() => handleDelete(t.id_tarifa)}
                              className="inline-flex items-center gap-1.5"
                            >
                              <Trash2 size={14} /> Eliminar
                            </Button>
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
      </Card>

      {/* Modal para Crear / Editar Tarifa */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTarifa ? 'Editar Tarifa' : 'Crear Nueva Tarifa'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">Volumen en Litros</label>
            <input 
              type="number" 
              value={form.volumen_litros} 
              onChange={e => setForm({ ...form, volumen_litros: e.target.value })}
              placeholder="Ej. 10000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary flex items-center justify-between">
              <span>Precio Base en Dólares ($ USD)</span>
              <span className="text-xs text-primary flex items-center gap-1">
                <DollarSign size={12} /> Moneda Principal
              </span>
            </label>
            <input 
              type="number" 
              step="0.01"
              value={form.precio_base} 
              onChange={e => setForm({ ...form, precio_base: e.target.value })}
              placeholder="Ej. 50.00"
              required
            />
          </div>

          {/* Vista previa de conversión en Bolívares */}
          <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-between">
            <span className="text-xs text-text-muted">Equivalente en Bolívares (BCV):</span>
            <span className="text-sm font-bold text-status-success">
              Bs. {Number(calculatedBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          {editingTarifa && (
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
              <span className="text-sm font-medium text-text-secondary">Estado de la tarifa</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.activo} 
                  onChange={e => setForm({ ...form, activo: e.target.checked })} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-background-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : (editingTarifa ? 'Guardar Cambios' : 'Crear Tarifa')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

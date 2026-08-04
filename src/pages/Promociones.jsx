import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Gift, Plus, Pencil, Trash2, Percent, Banknote, Crown, Ticket, Users, TrendingUp } from 'lucide-react';
import api from '../api/client';

export const Promociones = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'Porcentaje',
    valor: '',
    fecha_inicio: '',
    fecha_fin: '',
    limite_usos: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/promociones');
      setPromos(res.data.data || []);
    } catch (error) {
      console.error("Error fetching promociones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const isActive = (p) => {
    const now = new Date();
    return new Date(p.fecha_inicio) <= now && new Date(p.fecha_fin) >= now;
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setForm({ codigo: '', descripcion: '', tipo: 'Porcentaje', valor: '', fecha_inicio: '', fecha_fin: '', limite_usos: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      codigo: promo.codigo,
      descripcion: promo.descripcion,
      tipo: promo.tipo,
      valor: promo.valor,
      fecha_inicio: new Date(promo.fecha_inicio).toISOString().slice(0, 10),
      fecha_fin: new Date(promo.fecha_fin).toISOString().slice(0, 10),
      limite_usos: promo.limite_usos,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id_promocion) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta promoción?')) return;
    try {
      const res = await api.delete(`/admin/promociones/${id_promocion}`);
      alert(res.data?.message || 'Promoción eliminada');
      fetchPromos();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.codigo || !form.descripcion || !form.valor || !form.fecha_inicio || !form.fecha_fin || !form.limite_usos) return;

    try {
      setSubmitting(true);
      const payload = {
        codigo: form.codigo,
        descripcion: form.descripcion,
        tipo: form.tipo,
        valor: Number(form.valor),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        limite_usos: Number(form.limite_usos),
      };

      if (editingPromo) {
        await api.put(`/admin/promociones/${editingPromo.id_promocion}`, payload);
      } else {
        await api.post('/admin/promociones', payload);
      }
      setIsModalOpen(false);
      fetchPromos();
    } catch (error) {
      alert(`Error al guardar: ${error.response?.data?.error || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const tipoIcon = (tipo) => {
    if (tipo === 'Porcentaje') return <Percent size={14} />;
    if (tipo === 'Monto Fijo') return <Banknote size={14} />;
    return <Crown size={14} />;
  };

  const stats = {
    activas: promos.filter(isActive).length,
    totalUsos: promos.reduce((sum, p) => sum + (p._count?.usos || 0), 0),
    totalPromos: promos.length
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Gestión de Promociones</h2>
          <p className="text-text-muted text-sm mt-1">Administra códigos de descuento, campañas y recompensas activas.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-glow hover:bg-primary-dark transition-all flex items-center gap-2 ambient-glow"
        >
          <Plus size={18} /> Nueva Promoción
        </button>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6 hover:border-primary/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Ticket size={24} />
            </div>
            <span className="text-xs text-text-muted bg-background px-3 py-1 rounded-full font-semibold border border-border">Total</span>
          </div>
          <div className="text-4xl font-bold text-text-main group-hover:text-primary transition-colors">{stats.totalPromos}</div>
          <div className="text-sm text-text-muted mt-1 font-medium">Promociones Registradas</div>
        </div>
        
        <div className="glass-card rounded-xl p-6 hover:border-status-success/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-status-success/10 rounded-xl text-status-success">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs text-text-muted bg-background px-3 py-1 rounded-full font-semibold border border-border">Activas</span>
          </div>
          <div className="text-4xl font-bold text-text-main group-hover:text-status-success transition-colors">{stats.activas}</div>
          <div className="text-sm text-text-muted mt-1 font-medium">Campañas en Curso</div>
        </div>
        
        <div className="glass-card rounded-xl p-6 hover:border-status-location/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-status-location/10 rounded-xl text-status-location">
              <Users size={24} />
            </div>
            <span className="text-xs text-text-muted bg-background px-3 py-1 rounded-full font-semibold border border-border">Uso</span>
          </div>
          <div className="text-4xl font-bold text-text-main group-hover:text-status-location transition-colors">{stats.totalUsos}</div>
          <div className="text-sm text-text-muted mt-1 font-medium">Canjes Totales</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-xl flex flex-col flex-1">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-background/30 rounded-t-xl">
          <h3 className="text-xl font-bold text-text-main">Listado de Códigos</h3>
        </div>

        {loading ? (
          <div className="text-center p-16 text-text-muted animate-pulse">Cargando promociones...</div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-text-muted">
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <Gift size={48} className="text-primary opacity-60" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-1">No hay promociones</h3>
            <p className="text-text-muted text-sm">Crea una promoción para comenzar a ofrecer descuentos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-sm font-semibold text-text-muted">
                  <th className="p-4 whitespace-nowrap">Código</th>
                  <th className="p-4 whitespace-nowrap">Descripción</th>
                  <th className="p-4 whitespace-nowrap">Tipo</th>
                  <th className="p-4 whitespace-nowrap">Valor</th>
                  <th className="p-4 whitespace-nowrap">Validez</th>
                  <th className="p-4 whitespace-nowrap">Usos / Límite</th>
                  <th className="p-4 whitespace-nowrap">Estado</th>
                  <th className="p-4 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {promos.map((p) => {
                  const activa = isActive(p);
                  const usos = p._count?.usos || 0;
                  const porcentajeUso = p.limite_usos > 0 ? Math.min((usos / p.limite_usos) * 100, 100) : 0;
                  const isExhausted = usos >= p.limite_usos;
                  
                  return (
                    <tr key={p.id_promocion} className={`border-b border-border/30 hover:bg-white/5 transition-colors ${!activa ? 'opacity-70' : ''}`}>
                      <td className="p-4">
                        <span className="font-mono bg-background px-2 py-1 rounded text-primary border border-primary/30 font-semibold tracking-wider">
                          {p.codigo}
                        </span>
                      </td>
                      <td className="p-4 text-text-main font-medium">{p.descripcion}</td>
                      <td className="p-4 text-text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          {tipoIcon(p.tipo)} {p.tipo}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-text-main">
                        {p.tipo === 'Porcentaje' ? `${p.valor}%` : `$${p.valor.toFixed(2)}`}
                      </td>
                      <td className="p-4 text-xs text-text-muted">
                        {new Date(p.fecha_inicio).toLocaleDateString('es-VE')} - {new Date(p.fecha_fin).toLocaleDateString('es-VE')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden border border-border">
                            <div 
                              className={`h-full ${isExhausted ? 'bg-status-error' : 'bg-primary'}`} 
                              style={{ width: `${porcentajeUso}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-semibold ${isExhausted ? 'text-status-error' : 'text-text-muted'}`}>
                            {usos}/{p.limite_usos}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {activa ? (
                          <span className="bg-status-success/10 text-status-success px-3 py-1 rounded-full text-xs font-bold border border-status-success/20">
                            Activo
                          </span>
                        ) : (
                          <span className="bg-background text-text-muted px-3 py-1 rounded-full text-xs font-bold border border-border">
                            Expirado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(p)} className="p-2 text-text-muted hover:text-primary transition-colors" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.id_promocion)} className="p-2 text-text-muted hover:text-status-error transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Reestilizado (en vez de usar el Modal genérico, hacemos uno inline para el diseño específico si es necesario, o adaptamos los inputs) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPromo ? 'Editar Promoción' : 'Crear Nueva Promoción'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-sm mt-2">
          <div className="col-span-2">
            <label className="block text-text-muted font-semibold mb-1">Código Promocional</label>
            <input
              type="text"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="Ej. AQUA10"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none uppercase font-mono"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-text-muted font-semibold mb-1">Descripción Interna</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej. 10% de descuento en primer pedido"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="col-span-1">
            <label className="block text-text-muted font-semibold mb-1">Tipo de Beneficio</label>
            <select 
              value={form.tipo} 
              onChange={e => setForm({ ...form, tipo: e.target.value })} 
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
            >
              <option value="Porcentaje">Porcentaje (%)</option>
              <option value="Monto Fijo">Descuento Fijo ($)</option>
              <option value="Recompensa">Recompensa</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-text-muted font-semibold mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={e => setForm({ ...form, valor: e.target.value })}
              placeholder={form.tipo === 'Porcentaje' ? 'Ej. 15' : 'Ej. 5.00'}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="col-span-1">
            <label className="block text-text-muted font-semibold mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={form.fecha_inicio}
              onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
              required
            />
          </div>
          <div className="col-span-1">
            <label className="block text-text-muted font-semibold mb-1">Fecha Fin</label>
            <input
              type="date"
              value={form.fecha_fin}
              onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-text-muted font-semibold mb-1">Límite de Usos Totales</label>
            <input
              type="number"
              value={form.limite_usos}
              onChange={e => setForm({ ...form, limite_usos: e.target.value })}
              placeholder="Ej. 100"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 rounded-xl border border-border bg-background text-text-main font-semibold hover:bg-background-card transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:shadow-glow hover:bg-primary-dark transition-all"
            >
              {submitting ? 'Guardando...' : (editingPromo ? 'Guardar Cambios' : 'Guardar Promoción')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
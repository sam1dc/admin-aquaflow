import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CreditCard, Check, X, Eye, Smartphone, DollarSign, Wallet, FileText, ChevronRight } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import api from '../api/client';

const PAGE_SIZE_OPTIONS = [10, 15, 20, 25];

const metodoConfig = {
  'Pago Movil': { icon: Smartphone, color: 'text-primary' },
  'Zelle': { icon: DollarSign, color: 'text-status-success' },
  'Binance Pay': { icon: Wallet, color: 'text-status-warning' },
  'Saldo AquaFlow': { icon: CreditCard, color: 'text-status-location' },
};

const estatusVariant = {
  'Pendiente': 'warning',
  'Verificado': 'success',
  'Rechazado': 'error',
};

export const Pagos = () => {
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [pagosHistorial, setPagosHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendientes');
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPagoId, setSelectedPagoId] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4500);
  };

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);

  const fetchPagos = async (page = 1, size = pageSize, activeTab = tab) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(size));
      
      if (activeTab === 'pendientes') {
        const res = await api.get(`/admin/pagos/pendientes?${params.toString()}`);
        setPagosPendientes(res.data.data || []);
        setPagination(res.data.pagination || { total: res.data.data?.length || 0, page: 1, limit: size, totalPages: 1 });
      } else {
        const res = await api.get(`/admin/pagos?${params.toString()}`);
        setPagosHistorial(res.data.data || []);
        setPagination(res.data.pagination || { total: res.data.data?.length || 0, page: 1, limit: size, totalPages: 1 });
      }
    } catch (error) {
      console.error("Error fetching pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos(1, pageSize, tab);
  }, [tab]);

  const handlePrevPage = () => {
    if (pagination.page > 1) fetchPagos(pagination.page - 1, pageSize, tab);
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) fetchPagos(pagination.page + 1, pageSize, tab);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchPagos(1, newSize, tab);
  };

  const handleVerify = async (id_pago, verificado, motivo = undefined) => {
    try {
      if (!verificado && motivo === undefined) {
        setSelectedPagoId(id_pago);
        setShowRejectModal(true);
        return;
      }

      setActionLoading(id_pago);
      const res = await api.patch(`/payments/${id_pago}/verify`, { verificado, motivo_rechazo: motivo });
      showToast(res.data?.message || 'Pago procesado exitosamente', 'success');
      fetchPagos();
      setShowRejectModal(false);
      setMotivoRechazo('');
    } catch (error) {
      showToast(`Error: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-VE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderPagoCard = (pago, isPendiente) => {
    const pedido = pago.pedido;
    const cliente = pago.usuario || pedido?.cliente?.usuario;
    const config = metodoConfig[pago.metodo] || { icon: CreditCard, color: 'text-primary' };
    const Icon = config.icon;

    return (
      <div key={pago.id_pago} className="glass-card rounded-xl p-6 flex flex-col gap-4">
        {/* Cabecera Tarjeta */}
        <div className="flex justify-between items-start border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className={`bg-background p-2.5 rounded-lg border border-border/50 ${config.color}`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">{pago.metodo}</h3>
              <p className="text-xs text-text-muted">{pago.banco_emisor || 'N/A'} • {formatDate(pago.fecha_creacion || pago.fecha_verificacion)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-primary/10 text-primary font-semibold text-sm px-3 py-1 rounded-full border border-primary/20">
              ${Number(pago.monto_pagado).toFixed(2)}
            </span>
            {!isPendiente && (
              <Badge variant={estatusVariant[pago.estatus] || 'info'} className="text-[10px]">{pago.estatus}</Badge>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Referencia</p>
            <p className="text-sm text-text-main font-semibold font-mono">{pago.referencia || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Cliente</p>
            <p className="text-sm text-text-main">{cliente?.nombre || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Orden Asociada</p>
            <a href={`/pedidos?search=${pedido?.id_pedido}`} className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
              {pedido?.id_pedido?.slice(0, 8).toUpperCase() || 'N/A'} <ChevronRight size={14} />
            </a>
          </div>
        </div>

        {/* Acciones */}
        {isPendiente && (
          <div className="mt-auto pt-4 flex gap-4 border-t border-border/50">
            <button
              disabled={actionLoading === pago.id_pago}
              onClick={() => handleVerify(pago.id_pago, true)}
              className="flex-1 bg-status-success text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-status-success/90 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 ambient-glow"
            >
              <Check size={18} /> Verificar
            </button>
            <button
              disabled={actionLoading === pago.id_pago}
              onClick={() => handleVerify(pago.id_pago, false)}
              className="flex-1 border border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <X size={18} /> Rechazar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2">Verificación de Pagos</h2>
          <p className="text-text-muted">Revisa y aprueba las transacciones entrantes.</p>
        </div>
        {pagosPendientes.length > 0 && (
          <Badge variant="warning" className="mb-1">{pagosPendientes.length} Pendientes</Badge>
        )}
      </div>

      {/* Tabs estilo rediseño */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setTab('pendientes')}
          className={`px-8 py-4 font-semibold text-sm transition-all duration-300 outline-none ${tab === 'pendientes'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-text-main'
            }`}
        >
          Pendientes ({pagosPendientes.length})
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`px-8 py-4 font-semibold text-sm transition-all duration-300 outline-none ${tab === 'historial'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-text-main'
            }`}
        >
          Historial
        </button>
      </div>

      {/* Grid de Pagos */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center py-24 text-text-muted">
          <div className="animate-spin text-primary mb-4 opacity-50"><CreditCard size={48} /></div>
          <p className="animate-pulse font-medium">Cargando pagos...</p>
        </Card>
      ) : tab === 'pendientes' ? (
        pagosPendientes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-24 text-text-muted">
            <div className="p-4 rounded-2xl bg-status-success/10 mb-4">
              <Check size={48} className="text-status-success opacity-60" />
            </div>
            <h3 className="text-xl font-semibold text-status-success mb-2">Todo al día</h3>
            <p>Todos los pagos han sido procesados exitosamente.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {pagosPendientes.map((p) => renderPagoCard(p, true))}
          </div>
        )
      ) : (
        pagosHistorial.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-24 text-text-muted">
            <CreditCard size={64} className="text-primary opacity-20 mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">Sin historial</h3>
            <p>No hay pagos procesados aún.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {pagosHistorial.map((p) => renderPagoCard(p, false))}
          </div>
        )
      )}

      {/* Modal para Rechazar Pago */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Rechazar Pago"
      >
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-sm text-text-muted">Por favor, indique el motivo por el cual está rechazando este pago. Esta información será visible para el cliente.</p>
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Ej: El comprobante no es legible..."
            className="w-full bg-background/50 border border-border rounded-xl p-3 text-sm text-text-main resize-none focus:border-status-error focus:ring-1 focus:ring-status-error outline-none"
            rows={4}
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => handleVerify(selectedPagoId, false, motivoRechazo)}
              disabled={!motivoRechazo.trim() || actionLoading === selectedPagoId}
            >
              Rechazar Pago
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notificación Personalizada */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${toast.type === 'error' ? 'bg-status-error/10 border-status-error/30 text-status-error' : 'bg-status-success/10 border-status-success/30 text-status-success'
          }`}>
          <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-status-error/20' : 'bg-status-success/20'}`}>
            {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          </div>
          <div className="flex flex-col pr-4">
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
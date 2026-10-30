import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Banknote, Check, X, Smartphone } from 'lucide-react';
import api from '../api/client';

const estatusVariant = {
  Pendiente: 'warning',
  Procesado: 'success',
  Rechazado: 'error',
};

/**
 * Cola de retiros de los conductores.
 *
 * El backend ya tenía GET/PATCH /admin/retiros, pero el panel no los mostraba:
 * las solicitudes se quedaban Pendientes para siempre (había una desde
 * septiembre). El saldo se descuenta al solicitar; "Rechazar" lo devuelve.
 */
export const Retiros = () => {
  const [retiros, setRetiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Pendiente');
  const [accion, setAccion] = useState(null); // { retiro, tipo: 'Procesado' | 'Rechazado' }
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4500);
  };

  const fetchRetiros = async (estatus = tab) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/retiros?estatus=${encodeURIComponent(estatus)}`);
      setRetiros(res.data.data || []);
    } catch (error) {
      showToast(`Error: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetiros(tab);
  }, [tab]);

  const abrir = (retiro, tipo) => {
    setAccion({ retiro, tipo });
    setTexto('');
  };

  const cerrar = () => {
    if (!enviando) setAccion(null);
  };

  const confirmar = async () => {
    if (!accion) return;
    const rechazar = accion.tipo === 'Rechazado';
    if (rechazar && !texto.trim()) {
      showToast('Escribe el motivo del rechazo', 'error');
      return;
    }
    try {
      setEnviando(true);
      const res = await api.patch(`/admin/retiros/${accion.retiro.id_retiro}`, {
        estatus: accion.tipo,
        ...(rechazar ? { motivo_rechazo: texto.trim() } : { referencia: texto.trim() || undefined }),
      });
      showToast(res.data?.message || 'Retiro actualizado');
      setAccion(null);
      fetchRetiros();
    } catch (error) {
      showToast(`Error: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-VE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const pendientes = tab === 'Pendiente';

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2">Retiros de Conductores</h2>
          <p className="text-text-muted">Paga por Pago Móvil y marca la solicitud como procesada, o recházala para devolver el saldo.</p>
        </div>
        {pendientes && retiros.length > 0 && (
          <Badge variant="warning">{retiros.length} Pendientes</Badge>
        )}
      </div>

      <div className="flex border-b border-border/50">
        {[['Pendiente', 'Pendientes'], ['todos', 'Historial']].map(([valor, etiqueta]) => (
          <button
            key={valor}
            onClick={() => setTab(valor)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === valor ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-muted text-center py-12">Cargando retiros…</p>
      ) : retiros.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-text-muted">
          <Banknote size={36} className="mx-auto mb-3 opacity-60" />
          {pendientes ? 'No hay retiros pendientes.' : 'Todavía no hay retiros.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {retiros.map((r) => {
            const usuario = r.cisternero?.usuario;
            return (
              <div key={r.id_retiro} className="glass-card rounded-xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2.5 rounded-lg border border-border/50 text-primary">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main">{usuario?.nombre || 'Conductor'}</h3>
                      <p className="text-xs text-text-muted">{formatDate(r.fecha_solicitud)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-primary/10 text-primary font-semibold text-sm px-3 py-1 rounded-full border border-primary/20">
                      ${Number(r.monto).toFixed(2)}
                    </span>
                    {!pendientes && <Badge variant={estatusVariant[r.estatus] || 'info'}>{r.estatus}</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Banco</p>
                    <p className="text-sm text-text-main">{r.banco_destino}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Teléfono</p>
                    <p className="text-sm text-text-main font-mono">{r.telefono_destino}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Cédula / RIF</p>
                    <p className="text-sm text-text-main font-mono">{r.documento_destino}</p>
                  </div>
                  {r.referencia && (
                    <div className="col-span-2">
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Referencia del pago</p>
                      <p className="text-sm text-text-main font-mono">{r.referencia}</p>
                    </div>
                  )}
                  {r.motivo_rechazo && (
                    <div className="col-span-2">
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Motivo del rechazo</p>
                      <p className="text-sm text-status-error">{r.motivo_rechazo}</p>
                    </div>
                  )}
                </div>

                {r.estatus === 'Pendiente' && (
                  <div className="mt-auto pt-4 flex gap-4 border-t border-border/50">
                    <button
                      onClick={() => abrir(r, 'Procesado')}
                      className="flex-1 bg-status-success text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-status-success/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Marcar pagado
                    </button>
                    <button
                      onClick={() => abrir(r, 'Rechazado')}
                      className="flex-1 border border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!accion}
        onClose={cerrar}
        title={accion?.tipo === 'Rechazado' ? 'Rechazar retiro' : 'Marcar retiro como pagado'}
      >
        {accion && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              {accion.tipo === 'Rechazado'
                ? `Se devolverán $${Number(accion.retiro.monto).toFixed(2)} a la billetera del conductor.`
                : `Confirma que ya transferiste $${Number(accion.retiro.monto).toFixed(2)} por Pago Móvil.`}
            </p>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              placeholder={accion.tipo === 'Rechazado' ? 'Motivo del rechazo…' : 'Referencia de la transferencia (opcional)'}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={cerrar} disabled={enviando}>Cancelar</Button>
              <Button
                variant={accion.tipo === 'Rechazado' ? 'danger' : 'success'}
                onClick={confirmar}
                disabled={enviando}
              >
                {enviando ? 'Guardando…' : accion.tipo === 'Rechazado' ? 'Confirmar rechazo' : 'Marcar pagado'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast.show && createPortal(
        <div className={`fixed bottom-6 right-6 z-[10000] animate-fade-in flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
          toast.type === 'error' ? 'bg-status-error/10 border-status-error/30 text-status-error' : 'bg-status-success/10 border-status-success/30 text-status-success'
        }`}>
          {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          <span className="text-sm">{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
};

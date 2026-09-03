import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { Modal } from '../components/ui/Modal';
import {
  MapPin, Zap, Plus, Trash2, Save, RefreshCw,
  AlertTriangle, CheckCircle, Info, Route
} from 'lucide-react';

const DEFAULTS = {
  radio_urbano_km: 10,
  comision: 2.0,
  tramos: [{ desde_km: 10, hasta_km: null, precio_km: 0.5 }],
};

const InfoBox = ({ icon: Icon, color, title, children }) => (
  <div className={`flex gap-3 p-4 rounded-xl border bg-${color}/5 border-${color}/20`}>
    <Icon size={20} className={`text-${color} mt-0.5 shrink-0`} />
    <div>
      <p className={`text-sm font-bold text-${color} mb-0.5`}>{title}</p>
      <p className="text-sm text-text-muted leading-relaxed">{children}</p>
    </div>
  </div>
);

export const Fletes = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fromDB, setFromDB] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [radioUrbano, setRadioUrbano] = useState(DEFAULTS.radio_urbano_km);
  const [comision, setComision] = useState(DEFAULTS.comision);
  const [tramos, setTramos] = useState(DEFAULTS.tramos);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/admin/flete');
      const data = res.data.data;
      setConfig(data);
      setFromDB(data.desde_base_de_datos);
      setRadioUrbano(data.radio_urbano_km);
      setComision(data.comision);
      setTramos(
        data.tramos.length > 0
          ? data.tramos
          : [{ desde_km: data.radio_urbano_km, hasta_km: null, precio_km: 0.5 }]
      );
    } catch (e) {
      setErrorMsg('No se pudo cargar la configuración. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // --- Tramo handlers ---
  const addTramo = () => {
    setTramos(prev => {
      const last = prev[prev.length - 1];
      const nuevoDesde = last?.hasta_km ?? (last?.desde_km ?? radioUrbano);
      // Close last tramo's hasta_km if it was open
      const updated = prev.map((t, i) =>
        i === prev.length - 1 && t.hasta_km === null
          ? { ...t, hasta_km: nuevoDesde + 10 }
          : t
      );
      return [...updated, { desde_km: nuevoDesde + 10, hasta_km: null, precio_km: 0.5 }];
    });
  };

  const removeTramo = (idx) => {
    if (tramos.length === 1) return;
    setTramos(prev => {
      const next = prev.filter((_, i) => i !== idx);
      // Make last tramo open-ended
      const last = { ...next[next.length - 1], hasta_km: null };
      return [...next.slice(0, -1), last];
    });
  };

  const updateTramo = (idx, field, value) => {
    setTramos(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: value === '' ? null : Number(value) } : t
    ));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      // Build clean tramos: last one always has hasta_km = null
      const tramosClean = tramos.map((t, i) => ({
        desde_km: Number(t.desde_km),
        hasta_km: i === tramos.length - 1 ? null : Number(t.hasta_km),
        precio_km: Number(t.precio_km),
      }));

      await api.put('/admin/flete', {
        radio_urbano_km: Number(radioUrbano),
        comision: Number(comision),
        tramos: tramosClean,
      });
      setSuccessModal(true);
      fetchConfig();
    } catch (e) {
      const msg = e.response?.data?.error || 'Error al guardar la configuración';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  // --- Live preview ---
  const calcularPreview = (kmTotales) => {
    const kmExtra = Math.max(0, kmTotales - radioUrbano);
    let flete = 0;
    let restante = kmExtra;
    for (let i = 0; i < tramos.length; i++) {
      const t = tramos[i];
      const limite = t.hasta_km !== null ? t.hasta_km - t.desde_km : restante;
      const kmEnTramo = Math.min(restante, limite);
      flete += kmEnTramo * (t.precio_km || 0);
      restante -= kmEnTramo;
      if (restante <= 0) break;
    }
    return flete;
  };

  const BASE_3500 = 28; // $8 × 3.5 = $28 base para 3500L
  const previews = [
    { label: 'Upata (urbano)', km: 5, desc: 'Dentro del radio urbano' },
    { label: 'Chapire (~10 km)', km: 10, desc: 'Límite del radio urbano' },
    { label: 'El Manganeso (~20 km)', km: 20, desc: 'Zona minera' },
    { label: 'Santa María (~30 km)', km: 30, desc: 'Ruta larga' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2 flex items-center gap-3">
            <Route className="text-primary" size={30} />
            Configuración de Fletes
          </h2>
          <p className="text-text-muted">
            Define el radio urbano gratuito y los tramos de cobro por kilómetro recorrido.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fromDB ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-success/10 text-status-success font-semibold text-xs border border-status-success/20">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              Configuración activa en BD
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 font-semibold text-xs border border-yellow-500/20">
              <AlertTriangle size={12} />
              Usando valores por defecto
            </span>
          )}
          <button
            onClick={fetchConfig}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-primary transition-colors"
            title="Recargar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-sm font-medium">
          <AlertTriangle size={18} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* === FORMULARIO === */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          <form onSubmit={handleSave} className="flex flex-col gap-6">

            {/* Parámetros globales */}
            <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Parámetros Globales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted block">
                    Radio Urbano (km)
                    <span className="ml-2 text-xs text-text-muted/60 font-normal">Distancia sin cobro de flete</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      id="radio-urbano"
                      type="number"
                      min="0"
                      step="1"
                      value={radioUrbano}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setRadioUrbano(v);
                        // Sync first tramo
                        setTramos(prev => prev.map((t, i) => i === 0 ? { ...t, desde_km: v } : t));
                      }}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-9 pr-4 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted block">
                    Comisión Plataforma ($)
                    <span className="ml-2 text-xs text-text-muted/60 font-normal">Por pedido</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">$</span>
                    <input
                      id="comision"
                      type="number"
                      min="0"
                      step="0.01"
                      value={comision}
                      onChange={e => setComision(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-8 pr-4 text-text-main focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <InfoBox icon={Info} color="primary" title="¿Cómo funciona el radio urbano?">
                Todo viaje dentro de los primeros <strong>{radioUrbano} km</strong> no paga flete.
                Los kilómetros extras se cobran según los tramos configurados abajo.
              </InfoBox>
            </div>

            {/* Tramos de flete */}
            <div className="glass-card rounded-xl p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <Route size={18} className="text-primary" /> Tramos de Cobro por Km
                </h3>
                <button
                  type="button"
                  onClick={addTramo}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Plus size={15} /> Agregar Tramo
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {tramos.map((t, i) => {
                  const esUltimo = i === tramos.length - 1;
                  return (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-background/60 border border-border/50 group">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </div>

                      <div className="grid grid-cols-3 gap-3 flex-1">
                        <div className="space-y-1">
                          <label className="text-xs text-text-muted font-semibold">Desde (km)</label>
                          <input
                            type="number"
                            min="0"
                            value={t.desde_km}
                            onChange={e => updateTramo(i, 'desde_km', e.target.value)}
                            disabled={i === 0}
                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary/50 outline-none font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-muted font-semibold">
                            Hasta (km) {esUltimo && <span className="text-primary ml-1">∞</span>}
                          </label>
                          <input
                            type="number"
                            min={t.desde_km + 1}
                            value={esUltimo ? '' : (t.hasta_km ?? '')}
                            onChange={e => !esUltimo && updateTramo(i, 'hasta_km', e.target.value)}
                            disabled={esUltimo}
                            placeholder={esUltimo ? 'Sin límite' : ''}
                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary/50 outline-none font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-muted font-semibold">$ / km</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={t.precio_km}
                            onChange={e => updateTramo(i, 'precio_km', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary/50 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTramo(i)}
                        disabled={tramos.length === 1}
                        className="p-2 text-text-muted hover:text-status-error transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        title="Eliminar tramo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <InfoBox icon={Info} color="status-location" title="El último tramo siempre es abierto">
                El tramo final cubre todos los kilómetros desde su inicio sin límite superior (∞),
                garantizando que cualquier distancia siempre tenga un precio.
              </InfoBox>
            </div>

            {/* Guardar */}
            <button
              type="submit"
              id="btn-guardar-flete"
              disabled={saving || loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Guardando configuración...' : 'Guardar Configuración de Fletes'}
            </button>
          </form>
        </div>

        {/* === PREVIEW EN VIVO === */}
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-xl p-6 flex flex-col gap-4 sticky top-4">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Preview en Vivo
              <span className="text-xs text-text-muted font-normal ml-1">(3.500 L)</span>
            </h3>
            <p className="text-xs text-text-muted">
              Simulación con base <strong className="text-text-main">$28.00</strong> (3500L × $8/1000L) + flete calculado + comisión.
            </p>

            <div className="flex flex-col gap-3">
              {previews.map(({ label, km, desc }) => {
                const flete = calcularPreview(km);
                const total = BASE_3500 + flete + Number(comision);
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-background/60 border border-border/40 hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-main">{label}</p>
                      <p className="text-xs text-text-muted">{desc} · {km} km</p>
                      {flete > 0 && (
                        <p className="text-xs text-primary mt-0.5">+${flete.toFixed(2)} flete</p>
                      )}
                    </div>
                    <span className="text-xl font-bold text-text-main">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-text-muted">
                <strong className="text-text-main">Fórmula:</strong> Base + Flete (km extra × $/km) + Comisión ${Number(comision).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de éxito */}
      <Modal
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        title="¡Configuración Guardada!"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center">
            <CheckCircle size={36} className="text-status-success" />
          </div>
          <p className="text-text-muted text-center text-sm">
            La configuración de fletes fue actualizada exitosamente en la base de datos.
            Todos los nuevos pedidos ya usarán los precios configurados.
          </p>
          <button
            onClick={() => setSuccessModal(false)}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  );
};

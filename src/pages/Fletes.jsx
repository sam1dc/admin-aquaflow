import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { Modal } from '../components/ui/Modal';
import {
  MapPin, Zap, Plus, Trash2, Save, RefreshCw,
  AlertTriangle, CheckCircle, Info, Route, Map
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ZONE_COLORS = [
  { color: '#22c55e', opacity: 0.12, label: 'Sin flete' },          // green - radio urbano
  { color: '#3b82f6', opacity: 0.10, label: 'Tramo 1' },            // blue
  { color: '#f59e0b', opacity: 0.10, label: 'Tramo 2' },            // amber
  { color: '#ef4444', opacity: 0.08, label: 'Tramo 3' },            // red
  { color: '#a855f7', opacity: 0.08, label: 'Tramo 4' },            // purple
  { color: '#ec4899', opacity: 0.06, label: 'Tramo 5+' },           // pink
];

/** Auto-fit the map to show all pozos. */
const FitBounds = ({ pozos }) => {
  const map = useMap();
  useEffect(() => {
    if (pozos.length === 0) return;
    const bounds = L.latLngBounds(pozos.map((p) => [p.latitud, p.longitud]));
    map.fitBounds(bounds.pad(0.5), { maxZoom: 12 });
  }, [pozos, map]);
  return null;
};

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

export const Fletes = ({ isEmbedded = false }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fromDB, setFromDB] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pozos, setPozos] = useState([]);
  const [showMap, setShowMap] = useState(true);

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

  // Fetch pozos activos para el mapa
  useEffect(() => {
    api.get('/admin/pozos').then((res) => {
      const all = res.data.data || [];
      setPozos(all.filter((p) => p.activo));
    }).catch((err) => {
      console.error('[Fletes] Error al cargar pozos para el mapa:', err);
    });
  }, []);

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
    { label: 'A 5 km del Pozo', km: 5, desc: 'Dentro del radio urbano del pozo asignado' },
    { label: 'A 10 km del Pozo', km: 10, desc: 'Límite del radio urbano del pozo' },
    { label: 'A 20 km del Pozo', km: 20, desc: 'Zona alejada del pozo' },
    { label: 'A 30 km del Pozo', km: 30, desc: 'Ruta muy larga desde el pozo' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-8">

      {/* Header */}
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold text-text-main tracking-tight mb-2 flex items-center gap-3">
              <Route className="text-primary" size={30} />
              Configuración de Fletes
            </h2>
            <p className="text-text-muted">
              Define el radio urbano gratuito y los tramos de cobro por kilómetro recorrido midiendo desde el Pozo asignado.
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
      )}

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
                Todo viaje dentro de los primeros <strong>{radioUrbano} km</strong> medidos <strong>desde el Pozo asignado</strong> no paga flete extra.
                Los kilómetros adicionales se cobran según los tramos configurados abajo.
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
              Simulador de Viajes
              <span className="text-xs text-text-muted font-normal ml-1">(3.500 L)</span>
            </h3>
            <p className="text-xs text-text-muted">
              Simulación de viaje base <strong>$28.00</strong> + flete (medido desde el Pozo) + comisión.
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

      {/* === MAPA DE ZONAS === */}
      <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Map size={18} className="text-primary" />
            Mapa de Zonas por Pozo
          </h3>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
          >
            {showMap ? 'Ocultar' : 'Mostrar'} Mapa
          </button>
        </div>

        {showMap && (
          <>
            {pozos.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-text-muted gap-2">
                <MapPin size={36} className="opacity-30" />
                <p className="text-sm">No hay pozos activos para visualizar.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl overflow-hidden border border-border/50" style={{ height: 420 }}>
                  <MapContainer
                    center={[pozos[0]?.latitud || 8.0, pozos[0]?.longitud || -62.4]}
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitBounds pozos={pozos} />

                    {pozos.map((pozo) => {
                      const zones = [];

                      // Radio urbano (sin flete)
                      zones.push({
                        radius: radioUrbano * 1000,
                        color: ZONE_COLORS[0].color,
                        fillOpacity: ZONE_COLORS[0].opacity,
                        label: `Sin flete (0–${radioUrbano} km)`,
                      });

                      // Cada tramo de cobro
                      tramos.forEach((t, i) => {
                        const hastaKm = t.hasta_km ?? (t.desde_km + 20);
                        const c = ZONE_COLORS[Math.min(i + 1, ZONE_COLORS.length - 1)];
                        zones.push({
                          radius: hastaKm * 1000,
                          color: c.color,
                          fillOpacity: c.opacity,
                          label: `$${t.precio_km}/km (${t.desde_km}–${t.hasta_km ?? '∞'} km)`,
                        });
                      });

                      return (
                        <React.Fragment key={pozo.id_pozo}>
                          {[...zones].reverse().map((z, zi) => (
                            <Circle
                              key={`${pozo.id_pozo}-zone-${zi}`}
                              center={[pozo.latitud, pozo.longitud]}
                              radius={z.radius}
                              pathOptions={{
                                color: z.color,
                                fillColor: z.color,
                                fillOpacity: z.fillOpacity,
                                weight: 1.5,
                                dashArray: zi === zones.length - 1 ? undefined : '6 4',
                              }}
                            />
                          ))}
                          <Marker position={[pozo.latitud, pozo.longitud]}>
                            <Popup>
                              <div style={{ minWidth: 160 }}>
                                <strong>{pozo.nombre}</strong>
                                <br />
                                <span style={{ color: '#666', fontSize: 12 }}>{pozo.ubicacion}</span>
                                <hr style={{ margin: '6px 0', borderColor: '#eee' }} />
                                {zones.map((z, zi) => (
                                  <div key={zi} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: z.color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.15)' }} />
                                    {z.label}
                                  </div>
                                ))}
                              </div>
                            </Popup>
                          </Marker>
                        </React.Fragment>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: ZONE_COLORS[0].color }} />
                    <span className="text-xs text-text-muted">Sin flete (0–{radioUrbano} km)</span>
                  </div>
                  {tramos.map((t, i) => {
                    const c = ZONE_COLORS[Math.min(i + 1, ZONE_COLORS.length - 1)];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: c.color }} />
                        <span className="text-xs text-text-muted">
                          ${t.precio_km}/km ({t.desde_km}–{t.hasta_km ?? '∞'} km)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
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

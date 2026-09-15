import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

// Distance calculator using Haversine formula
const getDistanciaKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const FletesMap = ({ pozos, radioUrbano, tramos, calcularFleteKm }) => {
  const [testLocation, setTestLocation] = useState(null); // { lat, lng }

  const getNearestPozo = (lat, lng) => {
    if (pozos.length === 0) return null;
    let nearest = pozos[0];
    let minD = getDistanciaKm(lat, lng, nearest.latitud, nearest.longitud);
    for (let i = 1; i < pozos.length; i++) {
      const d = getDistanciaKm(lat, lng, pozos[i].latitud, pozos[i].longitud);
      if (d < minD) {
        nearest = pozos[i];
        minD = d;
      }
    }
    return { pozo: nearest, distancia: minD };
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setTestLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  if (pozos.length === 0) {
    return null;
  }

  return (
    <>
      <p className="text-xs text-text-muted mb-2">💡 Haz clic en cualquier parte del mapa para colocar un marcador de prueba y calcular el flete hasta el pozo más cercano.</p>
      <div className="rounded-xl overflow-hidden border border-border/50 relative" style={{ height: 600 }}>
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
                  <Popup autoPan={false}>
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

          <MapClickHandler />
          {testLocation && (() => {
            const nearest = getNearestPozo(testLocation.lat, testLocation.lng);
            if (!nearest) return null;
            const flete = calcularFleteKm(nearest.distancia);
            return (
              <Marker position={[testLocation.lat, testLocation.lng]} icon={redIcon}>
                <Popup autoPan={false}>
                  <div style={{ minWidth: 150 }}>
                    <strong style={{ color: '#ef4444' }}>Ubicación de Prueba</strong>
                    <br />
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <strong>Pozo más cercano:</strong> {nearest.pozo.nombre}<br/>
                      <strong>Distancia:</strong> {nearest.distancia.toFixed(2)} km
                    </div>
                    <hr style={{ margin: '6px 0', borderColor: '#eee' }} />
                    <div style={{ fontSize: 13 }}>
                      <strong>Flete estimado:</strong> <span style={{ color: flete > 0 ? '#ef4444' : '#22c55e' }}>{flete > 0 ? `+$${flete.toFixed(2)}` : '¡Gratis!'}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })()}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-4">
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
  );
};

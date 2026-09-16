import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Navigation } from 'lucide-react';
import api from '../../api/client';

// Coordenadas fijas de referencia
const DEFAULT_ORIGIN = { lat: 8.2965, lng: -62.7300, label: 'Llenadero Principal' };
const DEFAULT_DESTINATION = { lat: 8.3023619, lng: -62.7173281, label: 'Destino de Entrega' };

// Parser seguro de coordenadas
export const parseCoordinates = (coords, fallback = null) => {
  if (!coords) return fallback;
  if (typeof coords === 'object' && coords.lat != null && coords.lng != null) {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  if (typeof coords === 'string') {
    const parts = coords.split(',').map(s => Number(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  return fallback;
};

// Crear marcadores SVG con diseño AquaFlow
const createSvgIcon = (bgColor, borderColor, svgContent) => {
  return L.divIcon({
    className: 'aquaflow-map-pin',
    html: `
      <div style="
        background: ${bgColor};
        border: 2px solid ${borderColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 14px ${borderColor}99, 0 4px 10px rgba(0,0,0,0.6);
        color: white;
      ">
        ${svgContent}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const originIcon = createSvgIcon(
  '#09121F',
  '#3498DB',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498DB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
);

const destinationIcon = createSvgIcon(
  '#09121F',
  '#00FFC2',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00FFC2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>`
);

const truckIcon = createSvgIcon(
  '#09121F',
  '#F59E0B',
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`
);

// Controlador de Redimensionado y Cuadrantes para evitar parches negros
function MapAutoResizer({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const triggerResize = () => {
      map.invalidateSize();
      if (bounds && bounds.length > 0) {
        try {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
        } catch (e) {
          // Fit fallback
        }
      }
    };

    triggerResize();
    const t1 = setTimeout(triggerResize, 80);
    const t2 = setTimeout(triggerResize, 250);
    const t3 = setTimeout(triggerResize, 600);

    window.addEventListener('resize', triggerResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', triggerResize);
    };
  }, [map, bounds]);

  return null;
}

export const OrderMap = ({
  pedido,
  height = '230px',
  showRoute = true,
  className = '',
}) => {
  const [truckPos, setTruckPos] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);

  // Configuración de API Key si existe en entorno
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Origen y Destino seguros
  const origin = parseCoordinates(pedido?.coordenadas_origen, DEFAULT_ORIGIN);
  const destination = parseCoordinates(pedido?.coordenadas_destino, DEFAULT_DESTINATION);

  useEffect(() => {
    if (!pedido?.id_pedido) return;

    let isMounted = true;
    const fetchTracking = async () => {
      try {
        const [locRes, histRes] = await Promise.allSettled([
          api.get(`/tracking/order/${pedido.id_pedido}/location`),
          api.get(`/tracking/order/${pedido.id_pedido}/history`),
        ]);

        if (!isMounted) return;

        if (locRes.status === 'fulfilled' && locRes.value?.data?.data) {
          const loc = locRes.value.data.data;
          const lat = Number(loc.latitud);
          const lng = Number(loc.longitud);
          if (!isNaN(lat) && !isNaN(lng)) {
            setTruckPos({ lat, lng, timestamp: loc.timestamp });
          }
        }

        if (histRes.status === 'fulfilled' && Array.isArray(histRes.value?.data?.data)) {
          const hist = histRes.value.data.data
            .map(h => ({ lat: Number(h.latitud), lng: Number(h.longitud), timestamp: h.timestamp }))
            .filter(h => !isNaN(h.lat) && !isNaN(h.lng));
          setTrackingHistory(hist);
        }
      } catch (e) {}
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pedido?.id_pedido]);

  // Polilínea de ruta
  const polylinePoints = [];
  if (origin) polylinePoints.push([origin.lat, origin.lng]);
  if (truckPos && (!origin || truckPos.lat !== origin.lat || truckPos.lng !== origin.lng)) {
    polylinePoints.push([truckPos.lat, truckPos.lng]);
  }
  if (destination) polylinePoints.push([destination.lat, destination.lng]);

  const historyPolyline = trackingHistory.map(h => [h.lat, h.lng]);

  const allBounds = [
    ...(origin ? [[origin.lat, origin.lng]] : []),
    ...(destination ? [[destination.lat, destination.lng]] : []),
    ...(truckPos ? [[truckPos.lat, truckPos.lng]] : []),
  ];

  const center = truckPos
    ? [truckPos.lat, truckPos.lng]
    : destination
    ? [destination.lat, destination.lng]
    : [DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng];

  return (
    <div 
      className={`w-full h-full min-h-[200px] overflow-hidden rounded-xl relative border border-border bg-slate-900 shadow-inner ${className}`} 
      style={{ height, minHeight: '200px' }}
    >
      {/* Badge flotante GPS */}
      <div className="absolute top-2.5 right-2.5 z-[1000] flex items-center gap-2 pointer-events-none">
        {truckPos && (
          <span className="bg-background-card/90 backdrop-blur-md text-status-warning border border-status-warning/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-ping"></span>
            Cisterna GPS
          </span>
        )}
        <span className="bg-background-card/90 backdrop-blur-md text-text-muted border border-border px-2 py-0.5 rounded-md text-[10px] font-semibold">
          AquaFlow GPS
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', minHeight: '200px', background: '#09121F' }}
      >
        {/* OpenStreetMap estándar - 100% libre de marcas de agua o requerimientos de apikey */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Resizer automático para recalcular cuadrantes y prevenir parches negros */}
        <MapAutoResizer bounds={allBounds} />

        {/* Marcador de Origen */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <div className="text-slate-900 text-xs p-1">
                <p className="font-bold text-sky-600">Punto de Carga (Origen)</p>
                <p className="font-medium">{pedido?.direccion_origen || 'Llenadero Principal'}</p>
                <p className="text-[10px] text-slate-500 font-mono">{origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-slate-900 text-xs p-1">
                <p className="font-bold text-emerald-600">Destino de Entrega</p>
                <p className="font-medium">{pedido?.direccion_destino || 'Ubicación del Cliente'}</p>
                <p className="text-[10px] text-slate-500 font-mono">{destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Cisterna en Ruta */}
        {truckPos && (
          <Marker position={[truckPos.lat, truckPos.lng]} icon={truckIcon}>
            <Popup>
              <div className="text-slate-900 text-xs p-1">
                <p className="font-bold text-amber-600">Cisterna {pedido?.cisternero?.vehiculo?.placa || ''}</p>
                <p className="font-medium">{pedido?.cisternero?.usuario?.nombre || 'Conductor asignado'}</p>
                <p className="text-[10px] text-slate-500">Última posición GPS recibida</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Polilínea de la Ruta */}
        {showRoute && polylinePoints.length >= 2 && (
          <Polyline
            positions={polylinePoints}
            pathOptions={{
              color: '#00D2FF',
              weight: 4,
              opacity: 0.9,
              dashArray: '8, 8',
              lineCap: 'round',
            }}
          />
        )}

        {/* Polilínea de Historial */}
        {historyPolyline.length >= 2 && (
          <Polyline
            positions={historyPolyline}
            pathOptions={{
              color: '#F59E0B',
              weight: 3,
              opacity: 0.9,
              lineCap: 'round',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default OrderMap;

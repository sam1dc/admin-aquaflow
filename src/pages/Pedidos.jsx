import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Droplets, Package, MapPin, User, Truck, ChevronDown,
  Search, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, Wallet, AlertTriangle, Phone, Mail, Building
} from 'lucide-react';
import api from '../api/client';

const ESTADOS = [
  { key: 'Todos', label: 'Todos', icon: Package, color: 'text-primary', hex: '#3498DB' },
  { key: 'Pendiente', label: 'Pendiente', icon: Clock, color: 'text-status-warning', hex: '#F59E0B' },
  { key: 'Asignado', label: 'Asignado', icon: Truck, color: 'text-status-location', hex: '#00D2FF' },
  { key: 'En Ruta', label: 'En Ruta', icon: Droplets, color: 'text-primary', hex: '#3498DB' },
  { key: 'Entregado', label: 'Entregado', icon: CheckCircle2, color: 'text-status-success', hex: '#10B981' },
  { key: 'Cancelado', label: 'Cancelado', icon: XCircle, color: 'text-status-error', hex: '#EF4444' },
];

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25];

export const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats, setStats] = useState({});

  const fetchPedidos = useCallback(async (estado = filter, page = 1, search = searchTerm, size = pageSize) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (estado && estado !== 'Todos') params.append('estado', estado);
      params.append('page', String(page));
      params.append('limit', String(size));
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/admin/pedidos?${params.toString()}`);
      const { data, pagination: pag } = res.data;

      setPedidos(data || []);
      setPagination(pag || { total: 0, page: 1, limit: size, totalPages: 1 });
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, searchTerm, pageSize]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/pedidos?limit=1');
      const { pagination: pag } = res.data;
      setStats({ total: pag?.total || 0 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchPedidos(filter, 1, searchTerm);
  }, [filter, fetchPedidos]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPedidos(filter, 1, searchTerm);
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchPedidos(filter, pagination.page - 1, searchTerm);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchPedidos(filter, pagination.page + 1, searchTerm);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchPedidos(filter, 1, searchTerm, newSize);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('es-VE', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getEstadoInfo = (estadoStr) => {
    // Para Aceptado, usamos Asignado o En Ruta visualmente
    if (estadoStr === 'Aceptado') return ESTADOS.find(e => e.key === 'Asignado') || ESTADOS[0];
    return ESTADOS.find(e => e.key === estadoStr) || ESTADOS[0];
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Pedidos</h2>
          <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full border border-primary/20">
            {stats.total || 0}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((estado) => {
            const isActive = filter === estado.key;
            return (
              <button
                key={estado.key}
                onClick={() => setFilter(estado.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  isActive
                    ? 'glass-panel border-primary text-primary shadow-[0_0_15px_rgba(52,152,219,0.15)]'
                    : 'glass-panel text-text-muted hover:text-text-main border-transparent'
                }`}
              >
                {estado.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative focus-within:ring-2 focus-within:ring-primary/50 rounded-xl transition-all glass-panel flex items-center">
          <Search size={18} className="absolute left-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de cliente o ID de pedido..."
            className="w-full bg-transparent border-none text-text-main placeholder:text-text-muted py-3 pl-12 pr-4 focus:ring-0 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:shadow-glow hover:bg-primary-dark transition-all duration-200"
        >
          Buscar
        </button>
      </form>

      {/* Lista de pedidos */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center py-24 text-text-muted">
          <Loader2 size={48} className="animate-spin text-primary mb-4 opacity-50" />
          <p className="animate-pulse font-medium">Cargando pedidos...</p>
        </Card>
      ) : pedidos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-text-muted">
          <Package size={64} className="mb-4 opacity-20 text-primary" />
          <h3 className="text-xl font-semibold text-primary mb-2">No hay pedidos</h3>
          <p>No se encontraron pedidos con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {pedidos.map((p) => {
            const isExpanded = expandedId === p.id_pedido;
            const cliente = p.cliente?.usuario;
            const cisternero = p.cisternero?.usuario;
            const estadoInfo = getEstadoInfo(p.estado_actual);
            const tienePagos = (p.pagos || []).length > 0;
            const tieneIncidencias = (p.incidencias || []).length > 0;

            return (
              <div
                key={p.id_pedido}
                className="glass-panel rounded-lg overflow-hidden transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(52,152,219,0.1)]"
                style={{ borderLeftWidth: '4px', borderLeftColor: estadoInfo.hex }}
              >
                {/* Cabecera */}
                <div
                  className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer border-b border-border/30"
                  onClick={() => toggleExpand(p.id_pedido)}
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background flex items-center justify-center">
                      <Building size={20} className="text-text-muted" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main tracking-tight">Pedido de {cliente?.nombre || 'Cliente'}</h3>
                      <p className="text-text-muted text-sm">#{p.id_pedido.substring(0, 8).toUpperCase()} • {formatDate(p.fecha_creacion)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-text-muted">Volumen</p>
                      <p className="text-sm font-semibold text-text-main">{p.tarifa?.volumen_litros ? `${Number(p.tarifa.volumen_litros).toLocaleString()} L` : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-muted">Total</p>
                      <p className="text-lg font-bold text-primary">${Number(p.monto_total).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <estadoInfo.icon size={20} className={estadoInfo.color} title={p.estado_actual} />
                      {tienePagos && <CheckCircle2 size={20} className="text-status-success" title="Pago Registrado" />}
                      {tieneIncidencias && <AlertTriangle size={20} className="text-status-error" title="Incidencia Reportada" />}
                    </div>
                  </div>
                </div>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="p-6 bg-background/30 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Cliente & Asignación */}
                    <div className="space-y-4">
                      <h4 className="text-xs text-text-muted uppercase tracking-wider font-semibold">Cliente & Asignación</h4>
                      <div className="space-y-3">
                        <p className="text-sm text-text-main flex items-center gap-2">
                          <Phone size={14} className="text-text-muted" /> {cliente?.telefono || 'N/A'}
                        </p>
                        <div className="mt-2 p-3 rounded bg-background border border-border/50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background-card flex items-center justify-center">
                            <Truck size={14} className="text-text-muted" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-main">{cisternero?.nombre || 'Sin asignar'}</p>
                            {cisternero && <p className="text-xs text-primary font-medium">Placa: {p.cisternero?.vehiculo?.placa}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Costos */}
                    <div className="space-y-4">
                      <h4 className="text-xs text-text-muted uppercase tracking-wider font-semibold">Desglose de Costos</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-text-muted"><span>Subtotal:</span> <span>${Number(p.subtotal).toFixed(2)}</span></div>
                        {Number(p.monto_descuento) > 0 && (
                          <div className="flex justify-between text-status-success"><span>Descuento:</span> <span>-${Number(p.monto_descuento).toFixed(2)}</span></div>
                        )}
                        {Number(p.monto_recargo) > 0 && (
                          <div className="flex justify-between text-status-error"><span>Recargo:</span> <span>+${Number(p.monto_recargo).toFixed(2)}</span></div>
                        )}
                        <div className="w-full h-px bg-border/50 my-2"></div>
                        <div className="flex justify-between text-text-main font-semibold"><span>Total Final:</span> <span>${Number(p.monto_total).toFixed(2)}</span></div>
                      </div>
                    </div>

                    {/* Destino */}
                    <div className="space-y-4 col-span-1 md:col-span-2 flex flex-col">
                      <h4 className="text-xs text-text-muted uppercase tracking-wider font-semibold">Ubicación de Entrega</h4>
                      <div className="flex flex-col h-full bg-background/50 rounded-lg border border-border/50 p-4 gap-4">
                        <div className="flex items-start gap-3">
                          <MapPin size={24} className="text-primary mt-1 shrink-0" />
                          <p className="text-sm font-medium text-text-main break-all leading-relaxed">{p.coordenadas_destino || 'Ubicación no proporcionada'}</p>
                        </div>
                        
                        {p.coordenadas_destino && (
                          <div className="w-full h-48 rounded-lg overflow-hidden border border-border/30 mt-2">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              style={{ border: 0 }} 
                              loading="lazy" 
                              allowFullScreen 
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(p.coordenadas_destino)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            ></iframe>
                          </div>
                        )}

                        <div className="border-t border-border/50 pt-3">
                          <p className="text-xs text-text-muted">
                            {p.estados_log && p.estados_log.length > 0 ? (
                              <span className="flex flex-col gap-1">
                                <span className="font-semibold">Última actualización de ruta:</span>
                                <span>{p.estados_log[p.estados_log.length - 1].estado} el {formatShortDate(p.estados_log[p.estados_log.length - 1].timestamp)}</span>
                              </span>
                            ) : (
                              'A la espera de salida.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {!loading && pedidos.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <label className="text-sm text-text-muted">Mostrar:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-2 rounded-xl glass-panel text-text-main text-sm font-semibold focus:border-primary/50 outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt} className="bg-background-card">{opt} por pág.</option>
              ))}
            </select>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl glass-panel text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                Pág. {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl glass-panel text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cargando más */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};
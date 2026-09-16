import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, Truck, CreditCard, AlertTriangle, TrendingUp, DollarSign, 
  Calendar, Download, CheckCircle2, FileSpreadsheet, ArrowUpRight, Filter
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    cisternerosPendientes: 0,
    tarifasActivas: 0,
    promociones: 0,
    incidenciasActivas: 0,
  });

  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Filtros de Fecha para Reportes
  const [dateFilter, setDateFilter] = useState('7d'); // 'hoy' | '7d' | 'mes' | 'custom'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [cisternerosRes, tarifasRes, promosRes, incidenciasRes, pedidosRes] = await Promise.all([
          api.get('/admin/cisterneros/pendientes').catch(() => ({ data: { data: [] } })),
          api.get('/admin/tarifas').catch(() => ({ data: { data: [] } })),
          api.get('/admin/promociones').catch(() => ({ data: { data: [] } })),
          api.get('/admin/incidencias').catch(() => ({ data: { data: [] } })),
          api.get('/admin/pedidos?limit=50').catch(() => ({ data: { data: [] } })),
        ]);
        
        const incidenciasData = incidenciasRes.data.data || [];
        const incidenciasActivas = incidenciasData.filter(i => i.estatus_gestion !== 'Cerrada').length;

        setStats({
          cisternerosPendientes: cisternerosRes.data.data?.length || 0,
          tarifasActivas: tarifasRes.data.data?.length || 0,
          promociones: promosRes.data.data?.length || 0,
          incidenciasActivas: incidenciasActivas,
        });

        setPedidos(pedidosRes.data.data || []);
      } catch (error) {
        console.error("Error al cargar stats", error);
      } finally {
        setLoading(false);
        setLoadingOrders(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Manejo de cambio de preset de fecha
  const handleFilterPreset = (preset) => {
    setDateFilter(preset);
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    setEndDate(endStr);

    if (preset === 'hoy') {
      setStartDate(endStr);
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'mes') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  // Filtrar pedidos según rango de fecha seleccionado
  const filteredOrders = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    return pedidos.filter(p => {
      const orderDate = new Date(p.fecha_creacion);
      if (isNaN(orderDate.getTime())) return true;
      return orderDate >= start && orderDate <= end;
    });
  }, [pedidos, startDate, endDate]);

  // Pedidos completados / entregados para métricas de ganancias
  const completedOrders = useMemo(() => {
    return filteredOrders.filter(p => p.estado_actual === 'Entregado');
  }, [filteredOrders]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    // Si no hay pedidos entregados en el rango filtrado, calculamos con los pedidos disponibles o 0
    const relevant = completedOrders.length > 0 ? completedOrders : filteredOrders;
    
    const totalGanancias = relevant.reduce((sum, p) => sum + (Number(p.monto_total) || 0), 0);
    const totalCompletados = completedOrders.length;
    const ticketPromedio = totalCompletados > 0 
      ? totalGanancias / totalCompletados 
      : (relevant.length > 0 ? totalGanancias / relevant.length : 0);

    return {
      totalGanancias,
      totalCompletados,
      ticketPromedio,
      totalFiltrados: filteredOrders.length,
    };
  }, [completedOrders, filteredOrders]);

  // Datos para la gráfica de tendencias
  const chartData = useMemo(() => {
    const dailyMap = {};
    
    // Agrupar pedidos por fecha
    filteredOrders.forEach(p => {
      const d = new Date(p.fecha_creacion);
      const dateKey = !isNaN(d.getTime()) 
        ? d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
        : 'Reciente';

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, ganancias: 0, pedidos: 0 };
      }
      dailyMap[dateKey].ganancias += Number(p.monto_total) || 0;
      dailyMap[dateKey].pedidos += 1;
    });

    const data = Object.values(dailyMap);
    if (data.length === 0) {
      return [
        { date: 'Inicio', ganancias: 0, pedidos: 0 },
        { date: 'Hoy', ganancias: 0, pedidos: 0 }
      ];
    }
    return data;
  }, [filteredOrders]);

  // Exportar a Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      if (filteredOrders.length === 0) {
        toast.error("No hay pedidos en el rango de fechas seleccionado para exportar.");
        return;
      }

      const rows = filteredOrders.map(p => ({
        'ID Pedido': p.id_pedido,
        'Fecha': new Date(p.fecha_creacion).toLocaleString('es-VE'),
        'Cliente': p.cliente?.usuario?.nombre || 'N/A',
        'Teléfono Cliente': p.cliente?.usuario?.telefono || 'N/A',
        'Conductor': p.cisternero?.usuario?.nombre || 'Sin asignar',
        'Placa Vehículo': p.cisternero?.vehiculo?.placa || 'N/A',
        'Volumen (Lts)': p.tarifa?.volumen_litros ? Number(p.tarifa.volumen_litros) : 'N/A',
        'Subtotal ($)': Number(p.subtotal || 0).toFixed(2),
        'Descuento ($)': Number(p.monto_descuento || 0).toFixed(2),
        'Recargo ($)': Number(p.monto_recargo || 0).toFixed(2),
        'Total ($)': Number(p.monto_total || 0).toFixed(2),
        'Estado': p.estado_actual || 'Pendiente',
        'Origen': p.direccion_origen || 'Llenadero Principal',
        'Destino': p.direccion_destino || p.coordenadas_destino || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      
      // Auto-ancho de columnas
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Ganancias');

      const fileName = `AquaFlow_Ganancias_${startDate}_a_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Reporte exportado exitosamente (${fileName})`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al generar el archivo Excel");
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Vista General</h2>
          <p className="text-text-muted mt-1">Métricas de operación en tiempo real y reportes financieros.</p>
        </div>
      </div>

      {/* Bento Grid Dashboard - KPIs Principales */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* KPI 1: Tarifas Activas */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Droplets className="text-primary" size={20} />
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tarifas Activas</h3>
            </div>
            <span className="flex items-center text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              Activas
            </span>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-bold text-text-main">{stats.tarifasActivas}</span>
            <div className="h-8 mt-2 w-full opacity-60 flex items-end gap-1">
              <div className="w-1/6 h-[30%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[45%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[20%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[60%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[80%] bg-primary rounded-t-sm ambient-glow"></div>
              <div className="w-1/6 h-[100%] bg-primary rounded-t-sm ambient-glow"></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Cisterneros Pendientes */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Truck className="text-status-warning" size={20} />
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Conductores</h3>
            </div>
            {stats.cisternerosPendientes > 0 && <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse"></span>}
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div>
              <span className="text-4xl font-bold text-text-main">
                {stats.cisternerosPendientes === 0 ? "0" : stats.cisternerosPendientes}
              </span>
              <span className="text-sm text-text-muted ml-1">por validar</span>
            </div>
            {stats.cisternerosPendientes > 0 && (
              <div className="text-right">
                <span className="block text-xl font-bold text-status-warning">{stats.cisternerosPendientes}</span>
                <span className="text-xs text-text-muted">Pendientes</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI 3: Promociones Activas */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300">
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="text-status-success" size={20} />
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Promociones</h3>
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-bold text-text-main">{stats.promociones}</span>
            <p className="text-sm text-text-muted mt-1">Actualmente en sistema</p>
          </div>
        </div>

        {/* KPI 4: Incidencias */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300 border-status-error/30 group">
          <div className="absolute inset-0 bg-status-error/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-status-error" size={20} />
              <h3 className="text-xs font-semibold text-status-error uppercase tracking-wider">Incidencias</h3>
            </div>
          </div>
          <div className="mt-auto relative z-10 flex items-center justify-between">
            <span className="text-4xl font-bold text-status-error">{stats.incidenciasActivas}</span>
            <Link 
              to="/incidencias" 
              className="text-xs px-3 py-1 rounded bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors border border-status-error/20 flex items-center justify-center font-semibold"
            >
              Revisar
            </Link>
          </div>
        </div>

        {/* Cisterneros por Validar List */}
        <div className="col-span-12 glass-panel rounded-xl flex flex-col hover-ambient-glow transition-all duration-300">
          <div className="p-4 border-b border-border flex justify-between items-center bg-background/50 rounded-t-xl">
            <h3 className="text-lg font-semibold text-text-main">Conductores por Validar</h3>
            <Link to="/cisterneros" className="text-primary text-sm hover:underline flex items-center gap-1 font-semibold">
              Ver todos &rarr;
            </Link>
          </div>
          <div className="flex-1 p-0 overflow-hidden">
            {stats.cisternerosPendientes > 0 ? (
              <div className="p-6 text-center text-text-main">
                <Truck size={40} className="mx-auto mb-3 text-primary opacity-60" />
                <p className="font-medium text-base">Tienes {stats.cisternerosPendientes} conductor(es) esperando validación.</p>
                <Link 
                  to="/cisterneros" 
                  className="mt-3 inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors ambient-glow"
                >
                  Revisar Solicitudes
                </Link>
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted flex flex-col items-center justify-center">
                <Truck size={36} className="mb-2 opacity-20" />
                <p className="text-sm">No hay conductores pendientes de validación</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECCIÓN: Reportes y Historial de Ganancias                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-border/80 relative overflow-hidden">
        {/* Cabecera de la Sección y Filtros */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <DollarSign size={22} />
              </div>
              <h3 className="text-2xl font-bold text-text-main tracking-tight">
                Reportes y Historial de Ganancias
              </h3>
            </div>
            <p className="text-text-muted text-sm mt-1">
              Consolidado de ingresos generados, pedidos entregados y exportación financiera.
            </p>
          </div>

          {/* Barra de Filtros y Exportación */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Presets de fecha */}
            <div className="flex items-center bg-background/60 p-1 rounded-xl border border-border">
              {[
                { key: 'hoy', label: 'Hoy' },
                { key: '7d', label: 'Últimos 7 días' },
                { key: 'mes', label: 'Este mes' },
                { key: 'custom', label: 'Personalizado' },
              ].map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleFilterPreset(preset.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dateFilter === preset.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Selectores de fecha personalizada */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-background/60 p-1.5 rounded-xl border border-border animate-fade-in">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs text-text-main py-1 px-2 focus:ring-0"
                />
                <span className="text-text-muted text-xs">a</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs text-text-main py-1 px-2 focus:ring-0"
                />
              </div>
            )}

            {/* Botón Exportar a Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
            >
              <FileSpreadsheet size={16} /> Exportar a Excel
            </button>
          </div>
        </div>

        {/* Bento Grid de Métricas de Ganancias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Métrica 1: Total de Ganancias Generadas */}
          <div className="bg-background-card/90 rounded-xl p-5 border border-primary/20 relative overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Ganancias Totales
              </span>
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <DollarSign size={18} />
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-primary tracking-tight">
                ${metrics.totalGanancias.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-status-success" />
                Calculado a partir de pedidos completados
              </p>
            </div>
          </div>

          {/* Métrica 2: Total de Pedidos Completados */}
          <div className="bg-background-card/90 rounded-xl p-5 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Pedidos Completados
              </span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {metrics.totalCompletados}
              </p>
              <p className="text-xs text-text-muted mt-1.5">
                De un total de {metrics.totalFiltrados} pedidos en el rango
              </p>
            </div>
          </div>

          {/* Métrica 3: Ticket / Ganancia Promedio */}
          <div className="bg-background-card/90 rounded-xl p-5 border border-cyan-500/20 relative overflow-hidden flex flex-col justify-between group hover:border-cyan-500/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Ticket Promedio
              </span>
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TrendingUp size={18} />
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                ${metrics.ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-text-muted mt-1.5">
                Ingreso promedio por cada entrega realizada
              </p>
            </div>
          </div>
        </div>

        {/* Gráfica de Tendencias Interactivas (Recharts) */}
        <div className="bg-background/40 rounded-xl p-5 border border-border flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-base font-bold text-text-main flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Evolución de Ganancias en el Tiempo
              </h4>
              <p className="text-xs text-text-muted">
                Tendencia de facturación diaria según el periodo seleccionado ({startDate} a {endDate})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
              <span className="text-xs text-text-muted font-medium">Ingresos ($)</span>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGanancias" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: '#1E2D3D' }} 
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: '#1E2D3D' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background-card/95 border border-border p-3 rounded-xl shadow-2xl backdrop-blur-md">
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
                          <p className="text-base font-extrabold text-primary">
                            ${Number(data.ganancias || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {data.pedidos} pedido(s) registrados
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ganancias" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorGanancias)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

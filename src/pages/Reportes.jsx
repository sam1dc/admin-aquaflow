import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  DollarSign, Calendar, FileSpreadsheet, ArrowUpRight, TrendingUp, 
  CheckCircle2, Percent, RefreshCw, Layers, ShieldCheck, Filter,
  ChevronRight, ArrowDownRight, Info, Search, Truck, Droplets
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../api/client';

export const Reportes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtro de Ganancia por Comisión (true = Solo comisiones de plataforma, false = Ingresos brutos totales)
  const [soloComision, setSoloComision] = useState(false);
  // Tasa de comisión por defecto (12% según backend de pagos, o configurada en flete)
  const [commissionRate, setCommissionRate] = useState(12.0);

  // Filtros de Rango de Fechas
  const [dateFilter, setDateFilter] = useState('7d'); // 'hoy' | '7d' | 'mes' | 'año' | 'custom'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filtro de búsqueda rápida en pedidos
  const [searchTerm, setSearchTerm] = useState('');

  // Carga de configuración de comisión y pedidos
  const fetchReportData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Intentar obtener la tasa de comisión configurada en el sistema
      try {
        const fleteRes = await api.get('/admin/flete');
        if (fleteRes.data?.data?.comision !== undefined && fleteRes.data?.data?.comision !== null) {
          const cfgCom = Number(fleteRes.data.data.comision);
          if (!isNaN(cfgCom) && cfgCom > 0) {
            setCommissionRate(cfgCom);
          }
        }
      } catch (err) {
        // Usa el 12% por defecto si no responde
        console.debug('Usando tasa de comisión por defecto (12%)', err);
      }

      // Cargar primera página de pedidos
      const firstRes = await api.get('/admin/pedidos?limit=50&page=1');
      let allOrders = firstRes.data?.data || [];
      const pagination = firstRes.data?.pagination;

      // Si hay más páginas, cargarlas para asegurar que el reporte abarque el historial completo
      if (pagination && pagination.totalPages > 1) {
        const totalPagesToFetch = Math.min(pagination.totalPages, 8); // Hasta 400 pedidos
        const fetchPromises = [];
        for (let p = 2; p <= totalPagesToFetch; p++) {
          fetchPromises.push(
            api.get(`/admin/pedidos?limit=50&page=${p}`)
              .then(res => res.data?.data || [])
              .catch(() => [])
          );
        }
        const extraPages = await Promise.all(fetchPromises);
        extraPages.forEach(pageOrders => {
          allOrders = allOrders.concat(pageOrders);
        });
      }

      setPedidos(allOrders);
    } catch (error) {
      console.error('Error al cargar datos para reportes:', error);
      toast.error('No se pudieron cargar todos los pedidos del historial');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Manejo de cambio de presets de fecha
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
    } else if (preset === 'año') {
      const d = new Date(today.getFullYear(), 0, 1);
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  // Cálculo individual de comisión por pedido
  const getOrderCommission = useCallback((pedido) => {
    if (pedido.comision !== undefined && pedido.comision !== null && !isNaN(Number(pedido.comision))) {
      return Number(pedido.comision);
    }
    const total = Number(pedido.monto_total || 0);
    // Tasa porcentual sobre el monto total
    return (total * commissionRate) / 100;
  }, [commissionRate]);

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

  // Pedidos entregados dentro del rango filtrado
  const completedOrders = useMemo(() => {
    return filteredOrders.filter(p => p.estado_actual === 'Entregado');
  }, [filteredOrders]);

  // Métricas calculadas dinámicamente según el filtro activo
  const metrics = useMemo(() => {
    const relevantOrders = completedOrders.length > 0 ? completedOrders : filteredOrders;
    const totalCompleted = completedOrders.length;
    const totalFiltered = filteredOrders.length;

    // Facturación Bruta Total
    const grossTotal = relevantOrders.reduce((sum, p) => sum + (Number(p.monto_total) || 0), 0);
    
    // Ganancia Total por Comisión de Plataforma
    const commissionTotal = relevantOrders.reduce((sum, p) => sum + getOrderCommission(p), 0);

    // Valores dinámicos según si el filtro de comisión está activo
    const totalRevenue = soloComision ? commissionTotal : grossTotal;
    const averageTicket = totalCompleted > 0 
      ? (totalRevenue / totalCompleted) 
      : (relevantOrders.length > 0 ? totalRevenue / relevantOrders.length : 0);

    return {
      totalRevenue,
      grossTotal,
      commissionTotal,
      totalCompleted,
      totalFiltered,
      averageTicket,
    };
  }, [completedOrders, filteredOrders, soloComision, getOrderCommission]);

  // Datos para la gráfica de evolución en el tiempo
  const chartData = useMemo(() => {
    const dailyMap = {};

    filteredOrders.forEach(p => {
      const d = new Date(p.fecha_creacion);
      const dateKey = !isNaN(d.getTime())
        ? d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
        : 'Reciente';

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          ganancias: 0,
          gross: 0,
          comision: 0,
          pedidos: 0,
        };
      }

      const orderTotal = Number(p.monto_total) || 0;
      const orderCom = getOrderCommission(p);

      dailyMap[dateKey].gross += orderTotal;
      dailyMap[dateKey].comision += orderCom;
      dailyMap[dateKey].ganancias += soloComision ? orderCom : orderTotal;
      dailyMap[dateKey].pedidos += 1;
    });

    const data = Object.values(dailyMap);
    if (data.length === 0) {
      return [
        { date: 'Inicio', ganancias: 0, gross: 0, comision: 0, pedidos: 0 },
        { date: 'Hoy', ganancias: 0, gross: 0, comision: 0, pedidos: 0 }
      ];
    }
    return data;
  }, [filteredOrders, soloComision, getOrderCommission]);

  // Exportar a Excel con columnas enriquecidas para el desglose de comisiones
  const handleExportExcel = () => {
    try {
      if (filteredOrders.length === 0) {
        toast.error('No hay pedidos en el rango de fechas seleccionado para exportar.');
        return;
      }

      const rows = filteredOrders.map(p => {
        const total = Number(p.monto_total || 0);
        const comisionMonto = getOrderCommission(p);
        const netoCisternero = Math.max(0, total - comisionMonto);

        const baseRow = {
          'ID Pedido': p.id_pedido,
          'Fecha': new Date(p.fecha_creacion).toLocaleString('es-VE'),
          'Estado': p.estado_actual || 'Pendiente',
          'Cliente': p.cliente?.usuario?.nombre || 'N/A',
          'Teléfono Cliente': p.cliente?.usuario?.telefono || 'N/A',
          'Conductor': p.cisternero?.usuario?.nombre || 'Sin asignar',
          'Placa': p.cisternero?.vehiculo?.placa || 'N/A',
          'Volumen (Lts)': p.tarifa?.volumen_litros ? Number(p.tarifa.volumen_litros) : 'N/A',
          'Subtotal ($)': Number(p.subtotal || 0).toFixed(2),
          'Flete/Recargo ($)': Number(p.monto_recargo || 0).toFixed(2),
          'Descuento ($)': Number(p.monto_descuento || 0).toFixed(2),
          'Total Pedido ($)': total.toFixed(2),
        };

        if (soloComision) {
          return {
            ...baseRow,
            'Tasa Comisión': `${commissionRate}%`,
            'Comisión Plataforma ($)': comisionMonto.toFixed(2),
            'Neto Conductor ($)': netoCisternero.toFixed(2),
            'Origen': p.direccion_origen || 'Llenadero Principal',
            'Destino': p.direccion_destino || p.coordenadas_destino || 'N/A',
          };
        }

        return {
          ...baseRow,
          'Comisión Est. Plataforma ($)': comisionMonto.toFixed(2),
          'Origen': p.direccion_origen || 'Llenadero Principal',
          'Destino': p.direccion_destino || p.coordenadas_destino || 'N/A',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Ajuste automático de anchos de columna
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length, 16)
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      const sheetTitle = soloComision ? 'Reporte Comisiones' : 'Reporte Ganancias';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

      const prefix = soloComision ? 'AquaFlow_Comisiones' : 'AquaFlow_Ganancias';
      const fileName = `${prefix}_${startDate}_a_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Archivo Excel exportado exitosamente (${fileName})`);
    } catch (error) {
      console.error('Error al exportar archivo Excel:', error);
      toast.error('Error al generar el archivo Excel');
    }
  };

  // Pedidos filtrados por búsqueda rápida para la tabla inferior
  const displayedOrders = useMemo(() => {
    if (!searchTerm.trim()) return filteredOrders.slice(0, 15);
    const term = searchTerm.toLowerCase().trim();
    return filteredOrders.filter(p => {
      const clientName = p.cliente?.usuario?.nombre?.toLowerCase() || '';
      const driverName = p.cisternero?.usuario?.nombre?.toLowerCase() || '';
      const idMatch = p.id_pedido?.toLowerCase() || '';
      return clientName.includes(term) || driverName.includes(term) || idMatch.includes(term);
    }).slice(0, 15);
  }, [filteredOrders, searchTerm]);

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-12">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Encabezado Principal de la Página                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container/60 p-6 rounded-2xl border border-outline-variant/30 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <DollarSign size={26} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-text-main tracking-tight">
                Reportes e Ingresos
              </h2>
              <p className="text-text-muted text-sm mt-0.5">
                Métricas financieras consolidadas, desglose de comisiones y exportación para auditoría.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={fetchReportData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-main bg-background/50 hover:bg-background border border-border transition-all cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-primary' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSpreadsheet size={16} />
            <span>{soloComision ? 'Exportar Comisiones (Excel)' : 'Exportar a Excel'}</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Barra de Filtros: Rango de Fecha y Modo de Ganancias          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border border-border">
        {/* Selector de Rango de Fechas */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-semibold mr-1">
            <Calendar size={15} className="text-primary" />
            <span>Periodo:</span>
          </div>

          <div className="flex items-center bg-background/70 p-1 rounded-xl border border-border">
            {[
              { key: 'hoy', label: 'Hoy' },
              { key: '7d', label: '7 días' },
              { key: 'mes', label: 'Este mes' },
              { key: 'año', label: 'Este año' },
              { key: 'custom', label: 'Personalizado' },
            ].map(preset => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleFilterPreset(preset.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === preset.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Selector de Fechas Personalizadas */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-background/80 p-1 rounded-xl border border-border animate-fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs text-text-main py-1 px-2 focus:ring-0 cursor-pointer"
              />
              <span className="text-text-muted text-xs font-semibold">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs text-text-main py-1 px-2 focus:ring-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Toggle / Pestaña: Ganancia por Comisión */}
        <div className="flex items-center gap-3 self-end xl:self-auto">
          <div className="flex items-center bg-background/70 p-1 rounded-xl border border-border shadow-inner">
            <button
              type="button"
              onClick={() => setSoloComision(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !soloComision
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text-main hover:bg-white/5'
              }`}
            >
              <DollarSign size={14} />
              <span>Total Facturado</span>
            </button>

            <button
              type="button"
              onClick={() => setSoloComision(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                soloComision
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : 'text-text-muted hover:text-text-main hover:bg-white/5'
              }`}
            >
              <Percent size={14} />
              <span>Ganancia por Comisión</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                soloComision ? 'bg-black/20 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {commissionRate}%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta Informativa cuando el filtro de comisión está activo */}
      {soloComision && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-emerald-300 text-xs animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Modo Comisión Activo:</strong> Las métricas y la gráfica reflejan exclusivamente la ganancia neta correspondiente a la comisión del sistema (<strong>{commissionRate}%</strong>) por cada pedido completado.
            </span>
          </div>
          <button
            onClick={() => setSoloComision(false)}
            className="text-[11px] underline hover:text-emerald-200 cursor-pointer font-semibold whitespace-nowrap"
          >
            Ver facturación total
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Tarjetas de Métricas Principales (KPI Cards)                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Métrica 1: Ganancia Principal (Dinámica) */}
        <div className={`rounded-2xl p-5 border relative overflow-hidden flex flex-col justify-between transition-all duration-300 group ${
          soloComision 
            ? 'bg-background-card/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_4px_20px_rgba(16,185,129,0.08)]' 
            : 'bg-background-card/90 border-primary/20 hover:border-primary/50 shadow-[0_4px_20px_rgba(52,152,219,0.08)]'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                {soloComision ? 'Ganancia Neta por Comisión' : 'Ganancias Totales'}
              </span>
              <span className="text-[11px] text-text-muted font-medium">
                {soloComision ? `Comisión del sistema (${commissionRate}%)` : 'Facturación bruta generada'}
              </span>
            </div>
            <span className={`p-2.5 rounded-xl ${
              soloComision ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {soloComision ? <Percent size={20} /> : <DollarSign size={20} />}
            </span>
          </div>
          <div className="mt-2">
            <p className={`text-3xl font-black tracking-tight ${
              soloComision ? 'text-emerald-400' : 'text-primary'
            }`}>
              ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="text-xs text-text-muted mt-2 flex items-center justify-between pt-2 border-t border-border/50">
              <span className="flex items-center gap-1">
                <ArrowUpRight size={14} className={soloComision ? 'text-emerald-400' : 'text-primary'} />
                {soloComision ? 'Retención neta plataforma' : 'Volumen total liquidado'}
              </span>
              {soloComision && (
                <span className="text-[11px] font-bold text-text-muted">
                  Bruto: ${metrics.grossTotal.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Métrica 2: Total de Pedidos Completados */}
        <div className="bg-background-card/90 rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-500/50 relative overflow-hidden flex flex-col justify-between transition-all duration-300 group shadow-[0_4px_20px_rgba(6,182,212,0.08)]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Pedidos Completados
              </span>
              <span className="text-[11px] text-text-muted font-medium">
                Con estatus "Entregado"
              </span>
            </div>
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CheckCircle2 size={20} />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black text-cyan-400 tracking-tight">
              {metrics.totalCompleted}
            </p>
            <div className="text-xs text-text-muted mt-2 flex items-center justify-between pt-2 border-t border-border/50">
              <span>De {metrics.totalFiltered} pedidos en el rango</span>
              <span className="font-semibold text-text-secondary">
                {metrics.totalFiltered > 0 
                  ? `${Math.round((metrics.totalCompleted / metrics.totalFiltered) * 100)}% tasa éxito`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Métrica 3: Ticket / Ingreso Promedio */}
        <div className="bg-background-card/90 rounded-2xl p-5 border border-indigo-500/20 hover:border-indigo-500/50 relative overflow-hidden flex flex-col justify-between transition-all duration-300 group shadow-[0_4px_20px_rgba(99,102,241,0.08)]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                {soloComision ? 'Comisión Promedio / Pedido' : 'Ticket Promedio'}
              </span>
              <span className="text-[11px] text-text-muted font-medium">
                {soloComision ? 'Ganancia neta media por entrega' : 'Facturación media por entrega'}
              </span>
            </div>
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={20} />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black text-indigo-400 tracking-tight">
              ${metrics.averageTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="text-xs text-text-muted mt-2 flex items-center justify-between pt-2 border-t border-border/50">
              <span>Por entrega finalizada</span>
              <span className="font-semibold text-text-secondary">
                {soloComision ? `Tasa fija ${commissionRate}%` : 'Monto bruto'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Gráfica Interactiva de Evolución en el Tiempo                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-6 border border-border flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-lg font-bold text-text-main flex items-center gap-2">
              <TrendingUp size={20} className={soloComision ? 'text-emerald-400' : 'text-primary'} />
              {soloComision ? 'Evolución de Ganancias por Comisión' : 'Evolución de Ingresos en el Tiempo'}
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              {soloComision 
                ? `Ingresos diarios de la plataforma AquaFlow aplicando la comisión de ${commissionRate}% (${startDate} a ${endDate})`
                : `Tendencia de facturación diaria según los pedidos en el periodo seleccionado (${startDate} a ${endDate})`
              }
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full inline-block ${
                soloComision ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-primary shadow-sm shadow-primary/50'
              }`}></span>
              <span className="text-xs text-text-muted font-bold">
                {soloComision ? 'Comisión Neta ($)' : 'Facturación Total ($)'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReportes" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={soloComision ? '#10b981' : '#3b82f6'} 
                    stopOpacity={0.45} 
                  />
                  <stop 
                    offset="95%" 
                    stopColor={soloComision ? '#059669' : '#0284c7'} 
                    stopOpacity={0.0} 
                  />
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
                      <div className="bg-background-card/95 border border-border p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                          {label}
                        </p>
                        <p className={`text-base font-extrabold ${soloComision ? 'text-emerald-400' : 'text-primary'}`}>
                          ${Number(data.ganancias || 0).toFixed(2)}
                          <span className="text-xs text-text-muted font-normal ml-1">
                            {soloComision ? '(comisión neta)' : '(total bruto)'}
                          </span>
                        </p>
                        {soloComision && (
                          <p className="text-xs text-text-muted mt-1">
                            Facturación bruta: ${Number(data.gross || 0).toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">
                          {data.pedidos} pedido(s) registrado(s)
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
                stroke={soloComision ? '#10b981' : '#3b82f6'} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorReportes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Detalle y Auditoría de Pedidos en el Período                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-6 border border-border flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-base font-bold text-text-main flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              Detalle de Pedidos en el Rango
            </h4>
            <p className="text-xs text-text-muted">
              Mostrando los pedidos considerados en las métricas con el desglose correspondiente.
            </p>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por cliente, conductor o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-background/60 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-background-card/80 text-[11px] font-bold text-text-muted uppercase border-b border-border/70">
              <tr>
                <th className="py-3 px-4">ID Pedido</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Conductor</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                {soloComision && (
                  <>
                    <th className="py-3 px-4 text-right text-emerald-400">Comisión ({commissionRate}%)</th>
                    <th className="py-3 px-4 text-right">Neto Conductor</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={soloComision ? 8 : 6} className="py-8 text-center text-text-muted">
                    No se encontraron pedidos en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((p) => {
                  const total = Number(p.monto_total || 0);
                  const comision = getOrderCommission(p);
                  const neto = Math.max(0, total - comision);

                  return (
                    <tr key={p.id_pedido} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-text-main">
                        {p.id_pedido?.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(p.fecha_creacion).toLocaleDateString('es-VE', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-main">
                        {p.cliente?.usuario?.nombre || 'Cliente General'}
                      </td>
                      <td className="py-3 px-4">
                        {p.cisternero?.usuario?.nombre || (
                          <span className="text-text-muted italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.estado_actual === 'Entregado'
                            ? 'bg-status-success/10 text-status-success border border-status-success/20'
                            : p.estado_actual === 'Cancelado'
                            ? 'bg-status-error/10 text-status-error border border-status-error/20'
                            : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                        }`}>
                          {p.estado_actual || 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-text-main">
                        ${total.toFixed(2)}
                      </td>
                      {soloComision && (
                        <>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-400">
                            +${comision.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-text-muted">
                            ${neto.toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 15 && (
          <p className="text-[11px] text-text-muted text-center pt-1">
            Mostrando 15 de {filteredOrders.length} pedidos. Para el listado completo utiliza el botón <strong>Exportar a Excel</strong>.
          </p>
        )}
      </div>
    </div>
  );
};

export default Reportes;

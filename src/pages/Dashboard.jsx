import React, { useEffect, useState } from 'react';
import { Droplets, Truck, CreditCard, AlertTriangle, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import api from '../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    cisternerosPendientes: 0,
    tarifasActivas: 0,
    promociones: 0,
    incidenciasActivas: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cisternerosRes, tarifasRes, promosRes, incidenciasRes] = await Promise.all([
          api.get('/admin/cisterneros/pendientes').catch(() => ({ data: { data: [] } })),
          api.get('/admin/tarifas').catch(() => ({ data: { data: [] } })),
          api.get('/admin/promociones').catch(() => ({ data: { data: [] } })),
          api.get('/admin/incidencias').catch(() => ({ data: { data: [] } })),
        ]);
        
        const incidenciasData = incidenciasRes.data.data || [];
        const incidenciasActivas = incidenciasData.filter(i => i.estatus_gestion !== 'Cerrada').length;

        setStats({
          cisternerosPendientes: cisternerosRes.data.data?.length || 0,
          tarifasActivas: tarifasRes.data.data?.length || 0,
          promociones: promosRes.data.data?.length || 0,
          incidenciasActivas: incidenciasActivas,
        });
      } catch (error) {
        console.error("Error al cargar stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-main tracking-tight">Vista General</h2>
        <p className="text-text-muted mt-1">Métricas de operación en tiempo real.</p>
      </div>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* KPI 1: Tarifas Activas (Span 3) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Droplets className="text-primary text-xl" size={20} />
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tarifas Activas</h3>
            </div>
            <span className="flex items-center text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              Activas
            </span>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-bold text-text-main">{stats.tarifasActivas}</span>
            <div className="h-8 mt-2 w-full opacity-60 flex items-end gap-1">
              {/* Subtle trend line representation */}
              <div className="w-1/6 h-[30%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[45%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[20%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[60%] bg-border rounded-t-sm"></div>
              <div className="w-1/6 h-[80%] bg-primary rounded-t-sm ambient-glow"></div>
              <div className="w-1/6 h-[100%] bg-primary rounded-t-sm ambient-glow"></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Cisterneros Pendientes (Span 3) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Truck className="text-status-warning text-xl" size={20} />
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

        {/* KPI 3: Promociones Activas (Span 3) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300">
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="text-status-success text-xl" size={20} />
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Promociones</h3>
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-4xl font-bold text-text-main">{stats.promociones}</span>
            <p className="text-sm text-text-muted mt-1">Actualmente en sistema</p>
          </div>
        </div>

        {/* KPI 4: Incidencias (Span 3) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-4 flex flex-col hover-ambient-glow transition-all duration-300 border-status-error/30 group">
          <div className="absolute inset-0 bg-status-error/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4 border-b border-border pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-status-error text-xl" size={20} />
              <h3 className="text-xs font-semibold text-status-error uppercase tracking-wider">Incidencias</h3>
            </div>
          </div>
          <div className="mt-auto relative z-10 flex items-center justify-between">
            <span className="text-4xl font-bold text-status-error">{stats.incidenciasActivas}</span>
            <a href="/incidencias" className="text-xs px-3 py-1 rounded bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors border border-status-error/20 flex items-center justify-center">Revisar</a>
          </div>
        </div>

        {/* Main Content Row 2 */}
        
        {/* Cisterneros por Validar List (Span 12) */}
        <div className="col-span-12 glass-panel rounded-xl flex flex-col hover-ambient-glow transition-all duration-300">
          <div className="p-4 border-b border-border flex justify-between items-center bg-background/50 rounded-t-xl">
            <h3 className="text-xl font-semibold text-text-main">Conductores por Validar</h3>
            <a href="/cisterneros" className="text-primary text-sm hover:underline flex items-center">
              Ver todos &rarr;
            </a>
          </div>
          <div className="flex-1 p-0 overflow-hidden">
            {stats.cisternerosPendientes > 0 ? (
              <div className="p-8 text-center text-text-main">
                <Truck size={48} className="mx-auto mb-4 text-primary opacity-50" />
                <p className="font-medium text-lg">Tienes {stats.cisternerosPendientes} conductor(es) esperando validación.</p>
                <a href="/cisterneros" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors ambient-glow">Revisar Solicitudes</a>
              </div>
            ) : (
              <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center">
                <Truck size={48} className="mb-4 opacity-20" />
                <p>No hay conductores pendientes de validación</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

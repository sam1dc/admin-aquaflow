import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Droplets, Truck, CreditCard, AlertTriangle } from 'lucide-react';
import api from '../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    cisternerosPendientes: 0,
    tarifasActivas: 0,
    promociones: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cisternerosRes, tarifasRes, promosRes] = await Promise.all([
          api.get('/admin/cisterneros/pendientes').catch(() => ({ data: { data: [] } })),
          api.get('/admin/tarifas').catch(() => ({ data: { data: [] } })),
          api.get('/admin/promociones').catch(() => ({ data: { data: [] } })),
        ]);
        
        setStats({
          cisternerosPendientes: cisternerosRes.data.data?.length || 0,
          tarifasActivas: tarifasRes.data.data?.length || 0,
          promociones: promosRes.data.data?.length || 0,
        });
      } catch (error) {
        console.error("Error al cargar stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-text-main tracking-tight">Dashboard General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-glow">
              <Droplets size={28} />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Tarifas Activas</p>
              <p className="text-3xl font-bold text-text-main">{stats.tarifasActivas}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-status-warning/10 text-status-warning shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Truck size={28} />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Cisterneros Pendientes</p>
              <p className="text-3xl font-bold text-text-main">{stats.cisternerosPendientes}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-status-success/10 text-status-success shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CreditCard size={28} />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Promociones Activas</p>
              <p className="text-3xl font-bold text-text-main">{stats.promociones}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-status-error/10 text-status-error shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Alertas del Sistema</p>
              <p className="text-3xl font-bold text-text-main">0</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Últimas Actividades">
          <div className="flex flex-col items-center justify-center p-12 text-text-muted border-2 border-dashed border-border rounded-xl bg-background/30">
            No hay actividades recientes
          </div>
        </Card>
        
        <Card title="Cisterneros por Validar">
          {stats.cisternerosPendientes > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-background border border-border rounded-xl flex justify-between items-center transition-colors hover:border-primary/40">
                <span className="text-text-main font-medium">Tienes {stats.cisternerosPendientes} cisternero(s) esperando validación.</span>
                <a href="/cisterneros" className="text-primary text-sm font-semibold hover:text-primary-dark transition-colors px-3 py-1.5 bg-primary/10 rounded-lg">Revisar</a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-text-muted border-2 border-dashed border-border rounded-xl bg-background/30">
              No hay cisterneros pendientes de validación
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

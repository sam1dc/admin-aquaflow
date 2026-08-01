import React from 'react';
import { Card } from '../components/ui/Card';
import { Droplets } from 'lucide-react';

export const Pedidos = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-text-main tracking-tight">Historial de Pedidos</h2>
      <Card>
        <div className="flex flex-col items-center justify-center p-16 text-text-muted">
          <div className="p-4 rounded-2xl bg-primary/10 mb-4">
            <Droplets size={48} className="text-primary opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1">Módulo en Desarrollo</h3>
          <p className="text-text-muted text-sm">Aquí se mostrará el historial completo de pedidos y su estado.</p>
        </div>
      </Card>
    </div>
  );
};

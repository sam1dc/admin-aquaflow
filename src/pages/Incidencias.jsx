import React from 'react';
import { Card } from '../components/ui/Card';
import { AlertTriangle } from 'lucide-react';

export const Incidencias = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-text-main tracking-tight">Resolución de Incidencias</h2>
      <Card>
        <div className="flex flex-col items-center justify-center p-16 text-text-muted">
          <div className="p-4 rounded-2xl bg-status-error/10 mb-4">
            <AlertTriangle size={48} className="text-status-error opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1">Módulo en Desarrollo</h3>
          <p className="text-text-muted text-sm">Aquí se gestionarán los reportes, quejas y disputas activas (CRD-011).</p>
        </div>
      </Card>
    </div>
  );
};

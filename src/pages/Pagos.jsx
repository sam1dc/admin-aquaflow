import React from 'react';
import { Card } from '../components/ui/Card';
import { CreditCard } from 'lucide-react';

export const Pagos = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-text-main tracking-tight">Verificación de Pagos</h2>
      <Card>
        <div className="flex flex-col items-center justify-center p-16 text-text-muted">
          <div className="p-4 rounded-2xl bg-status-success/10 mb-4">
            <CreditCard size={48} className="text-status-success opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1">Módulo en Desarrollo</h3>
          <p className="text-text-muted text-sm">Aquí se listarán los pagos pendientes de verificación (CRD-007).</p>
        </div>
      </Card>
    </div>
  );
};

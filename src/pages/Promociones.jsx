import React from 'react';
import { Card } from '../components/ui/Card';
import { Gift } from 'lucide-react';

export const Promociones = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-text-main tracking-tight">Promociones y Descuentos</h2>
      <Card>
        <div className="flex flex-col items-center justify-center p-16 text-text-muted">
          <div className="p-4 rounded-2xl bg-status-warning/10 mb-4">
            <Gift size={48} className="text-status-warning opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1">Módulo en Desarrollo</h3>
          <p className="text-text-muted text-sm">Esta sección permitirá gestionar los códigos de promoción.</p>
        </div>
      </Card>
    </div>
  );
};

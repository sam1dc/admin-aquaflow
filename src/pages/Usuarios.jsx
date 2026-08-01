import React from 'react';
import { Card } from '../components/ui/Card';
import { Users as UsersIcon } from 'lucide-react';

export const Usuarios = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-text-main tracking-tight">Gestión de Usuarios</h2>
      <Card>
        <div className="flex flex-col items-center justify-center p-16 text-text-muted">
          <div className="p-4 rounded-2xl bg-status-location/10 mb-4">
            <UsersIcon size={48} className="text-status-location opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1">Módulo en Desarrollo</h3>
          <p className="text-text-muted text-sm">Aquí se gestionarán las cuentas de clientes y administradores.</p>
        </div>
      </Card>
    </div>
  );
};

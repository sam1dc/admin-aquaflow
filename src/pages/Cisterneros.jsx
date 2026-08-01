import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Check, X, User, Truck } from 'lucide-react';
import api from '../api/client';

export const Cisterneros = () => {
  const [cisterneros, setCisterneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCisterneros = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/cisterneros/pendientes');
      setCisterneros(res.data.data || []);
    } catch (error) {
      console.error("Error fetching cisterneros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCisterneros();
  }, []);

  const handleValidation = async (id, aprobado) => {
    try {
      setActionLoading(id);
      let motivo_rechazo = undefined;
      
      if (!aprobado) {
        motivo_rechazo = window.prompt('Indique el motivo del rechazo:');
        if (motivo_rechazo === null) return;
      }

      await api.patch(`/admin/cisterneros/${id}/validar`, { aprobado, motivo_rechazo });
      setCisterneros(prev => prev.filter(c => c.id_cisternero !== id));
      
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted animate-pulse">Cargando cisterneros pendientes...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Cisterneros Pendientes</h2>
          <p className="text-text-muted mt-2">Valide la documentación de los transportistas antes de permitirles operar (CRD-002).</p>
        </div>
        <Badge variant="warning">{cisterneros.length} Pendientes</Badge>
      </div>

      {cisterneros.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center p-16 text-text-muted">
            <Truck size={56} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-primary mb-1">Todo al día</h3>
            <p>No hay cisterneros pendientes de validación en este momento.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {cisterneros.map((c) => (
            <Card key={c.id_cisternero} className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="flex items-center gap-2 text-primary font-semibold mb-3 border-b border-border pb-2">
                    <User size={18} /> Datos Personales
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-text-muted">Nombre:</span> <span className="text-text-main">{c.usuario.nombre}</span>
                    <span className="text-text-muted">Teléfono:</span> <span className="text-text-main">{c.usuario.telefono}</span>
                    <span className="text-text-muted">Email:</span> <span className="text-text-main">{c.usuario.email}</span>
                    <span className="text-text-muted">RIF:</span> <span className="text-text-main">{c.rif_personal}</span>
                    <span className="text-text-muted">Licencia:</span> <span className="text-text-main">{c.licencia_conducir}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="flex items-center gap-2 text-primary font-semibold mb-3 border-b border-border pb-2">
                    <Truck size={18} /> Vehículo
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-text-muted">Marca:</span> <span className="text-text-main">{c.vehiculo?.marca}</span>
                    <span className="text-text-muted">Modelo:</span> <span className="text-text-main">{c.vehiculo?.modelo}</span>
                    <span className="text-text-muted">Placa:</span> <span className="text-text-main">{c.vehiculo?.placa}</span>
                    <span className="text-text-muted">Capacidad:</span> <span className="text-text-main">{c.vehiculo?.capacidad_tanque} L</span>
                  </div>
                  {c.vehiculo?.fotos_url && (
                    <a href={c.vehiculo.fotos_url} target="_blank" rel="noreferrer" className="text-xs text-primary mt-3 inline-block hover:text-primary-dark transition-colors">
                      Ver foto del vehículo →
                    </a>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-3 md:min-w-[150px] border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <Button 
                  variant="success" 
                  className="w-full justify-center"
                  disabled={actionLoading === c.id_cisternero}
                  onClick={() => handleValidation(c.id_cisternero, true)}
                >
                  <Check size={18} className="mr-2" /> Aprobar
                </Button>
                <Button 
                  variant="danger" 
                  className="w-full justify-center"
                  disabled={actionLoading === c.id_cisternero}
                  onClick={() => handleValidation(c.id_cisternero, false)}
                >
                  <X size={18} className="mr-2" /> Rechazar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

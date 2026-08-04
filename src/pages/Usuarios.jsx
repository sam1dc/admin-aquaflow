import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Users as UsersIcon, User, Truck, Shield, CheckCircle2, MoreVertical, Star, Ban, Car, CreditCard, ExternalLink, AlertTriangle } from 'lucide-react';
import api from '../api/client';

const rolVariant = {
  'cliente': 'info',
  'cisternero': 'primary',
  'administrador': 'warning',
};

const rolLabel = {
  'cliente': 'Cliente',
  'cisternero': 'Cisternero',
  'administrador': 'Admin',
};

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data.data || []);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const getRol = (u) => {
    if (u.administrador) return 'administrador';
    if (u.cisternero) return 'cisternero';
    if (u.cliente) return 'cliente';
    return 'desconocido';
  };

  const handleHabilitar = async (id_usuario) => {
    if (!window.confirm('¿Estás seguro de que deseas habilitar esta cuenta?')) return;
    try {
      setActionLoading(id_usuario);
      const res = await api.patch(`/admin/usuarios/${id_usuario}/habilitar`);
      alert(res.data?.message || 'Cuenta habilitada exitosamente');
      fetchUsuarios();
      setSelectedUser(null);
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const roles = ['Todos', 'Cliente', 'Cisternero', 'Admin'];
  const filtered = filter === 'Todos'
    ? usuarios
    : usuarios.filter(u => {
        const rol = getRol(u);
        return (filter === 'Cliente' && rol === 'cliente') ||
               (filter === 'Cisternero' && rol === 'cisternero') ||
               (filter === 'Admin' && rol === 'administrador');
      });

  const getUserIcon = (rol) => {
    if (rol === 'cliente') return <User size={24} className="text-status-location" />;
    if (rol === 'cisternero') return <Truck size={24} className="text-status-warning" />;
    return <Shield size={24} className="text-primary" />;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight flex items-center gap-3">
            Gestión de Usuarios
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 rounded-full text-sm font-semibold flex items-center justify-center">
              {usuarios.length}
            </span>
          </h2>
          <p className="text-text-muted text-sm mt-1">Administra accesos, roles y saldos de todos los participantes de la plataforma.</p>
        </div>
      </div>

      {/* Advanced Filters Bar (Glassmorphism) */}
      <div className="glass-card rounded-xl p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0">
          {roles.map((rol) => {
            const isActive = filter === rol;
            return (
              <button
                key={rol}
                onClick={() => setFilter(rol)}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap outline-none ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-transparent border border-transparent text-text-muted hover:text-text-main hover:bg-white/5'
                }`}
              >
                {rol === 'Admin' ? 'Administradores' : rol === 'Cliente' ? 'Clientes' : rol === 'Cisternero' ? 'Cisterneros' : 'Todos'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento Grid of Users */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 text-text-muted glass-card rounded-xl">
          <UsersIcon size={48} className="animate-pulse opacity-50 mb-4 text-primary" />
          <p className="animate-pulse font-medium">Cargando usuarios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-text-muted glass-card rounded-xl">
          <div className="p-4 rounded-2xl bg-primary/10 mb-4">
            <UsersIcon size={48} className="text-primary opacity-60" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Sin resultados</h3>
          <p>No se encontraron usuarios con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((u) => {
            const rol = getRol(u);
            const isBanned = u.cuenta_inhabilitada;
            const sancionesPendientes = (u.sanciones || []).filter(s => s.estado === 'Pendiente').length;

            return (
              <div 
                key={u.id_usuario} 
                className={`glass-card rounded-xl p-6 flex flex-col gap-4 transition-all duration-300 group ${isBanned ? 'border-status-error/40 hover:border-status-error/60' : 'hover:border-primary/40 hover:shadow-glow'}`}
              >
                {isBanned && (
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-status-error/10 blur-[30px] rounded-full pointer-events-none"></div>
                )}
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isBanned ? 'bg-background border-status-error/30 opacity-70' : 'bg-background-card border-border'}`}>
                        {getUserIcon(rol)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background-card ${isBanned ? 'bg-status-error' : 'bg-status-success'}`}></div>
                    </div>
                    <div>
                      <h3 className={`text-base font-bold leading-tight transition-colors ${isBanned ? 'text-text-muted line-through' : 'text-text-main group-hover:text-primary'}`}>
                        {u.nombre}
                      </h3>
                      <p className="text-xs text-text-muted mt-1">{u.email}</p>
                    </div>
                  </div>
                  
                  {isBanned ? (
                    <div className="bg-status-error/10 text-status-error border border-status-error/20 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                      <Ban size={12} /> Suspendido
                    </div>
                  ) : (
                    <div className={`border px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                      rol === 'cliente' ? 'bg-primary/10 text-primary border-primary/20' :
                      rol === 'cisternero' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                      'bg-status-location/10 text-status-location border-status-location/20'
                    }`}>
                      {rol === 'cliente' && u.cliente?._count?.pedidos > 5 ? (
                        <span className="flex items-center gap-1"><Star size={12} /> VIP</span>
                      ) : rol}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-border/50 relative z-10">
                  {rol === 'cliente' && u.cliente && (
                    <>
                      <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1 uppercase font-bold tracking-wider">Saldo Billetera</p>
                        <p className="text-sm font-bold text-status-success flex items-center gap-1">
                          <CreditCard size={14} /> ${Number(u.cliente.saldo_billetera).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1 uppercase font-bold tracking-wider">Total Pedidos</p>
                        <p className="text-sm font-bold text-text-main">{u.cliente._count?.pedidos || 0}</p>
                      </div>
                    </>
                  )}
                  {rol === 'cisternero' && u.cisternero && (
                    <>
                      <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1 uppercase font-bold tracking-wider">Balance</p>
                        <p className="text-sm font-bold text-text-main flex items-center gap-1">
                          <CreditCard size={14} className="text-status-success" /> ${Number(u.cisternero.balance_billetera).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1 uppercase font-bold tracking-wider">Vehículo</p>
                        <p className="text-sm font-bold text-text-main flex items-center gap-1">
                          <Car size={14} className="text-primary" /> {u.cisternero.vehiculo?.placa || 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                  {rol === 'administrador' && u.administrador && (
                    <>
                      <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1 uppercase font-bold tracking-wider">Nivel Acceso</p>
                        <p className="text-sm font-bold text-text-main">{u.administrador.nivel_permiso || 'Admin'}</p>
                      </div>
                      <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1 uppercase font-bold tracking-wider">Estado</p>
                        <p className="text-sm font-bold text-status-success">Activo</p>
                      </div>
                    </>
                  )}
                  {sancionesPendientes > 0 && (
                    <div className="col-span-2 bg-status-warning/10 p-3 rounded-lg border border-status-warning/30 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-status-warning mb-1 uppercase font-bold tracking-wider">Atención</p>
                        <p className="text-sm font-bold text-text-main">{sancionesPendientes} Sanciones Pendientes</p>
                      </div>
                      <AlertTriangle size={20} className="text-status-warning" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 relative z-10">
                  <button 
                    onClick={() => setSelectedUser(u)}
                    className={`flex-1 bg-transparent border border-border py-2 rounded-lg transition-colors text-sm font-semibold flex justify-center items-center gap-2 ${isBanned ? 'hover:border-status-error/50 text-status-error hover:bg-status-error/10' : 'hover:border-primary hover:text-primary text-text-muted'}`}
                  >
                    {isBanned ? 'Gestionar Estado' : 'Ver Detalles'}
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center bg-transparent border border-border hover:bg-white/5 rounded-lg text-text-muted transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detalles del Usuario (Modal) */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Detalles del Usuario">
        {selectedUser && (
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
              <div className="w-16 h-16 rounded-2xl bg-background-card border border-border flex items-center justify-center">
                {getUserIcon(getRol(selectedUser))}
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main">{selectedUser.nombre}</h3>
                <p className="text-sm text-text-muted">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={rolVariant[getRol(selectedUser)] || 'info'}>
                    {rolLabel[getRol(selectedUser)] || getRol(selectedUser)}
                  </Badge>
                  {selectedUser.cuenta_inhabilitada && <Badge variant="error">Inhabilitada</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Contacto</h4>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-text-muted">Teléfono:</span> <span className="font-medium text-text-main">{selectedUser.telefono || 'N/A'}</span></p>
                  <p className="flex justify-between"><span className="text-text-muted">Email:</span> <span className="font-medium text-text-main">{selectedUser.email}</span></p>
                </div>
              </div>

              {getRol(selectedUser) === 'cliente' && selectedUser.cliente && (
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Datos Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-text-muted">RIF/CI:</span> <span className="font-medium text-text-main">{selectedUser.cliente.identificacion_fiscal || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-text-muted">Billetera:</span> <span className="font-bold text-status-success">${Number(selectedUser.cliente.saldo_billetera).toFixed(2)}</span></p>
                    <p className="flex justify-between"><span className="text-text-muted">Pedidos:</span> <span className="font-medium text-text-main">{selectedUser.cliente._count?.pedidos || 0}</span></p>
                  </div>
                </div>
              )}

              {getRol(selectedUser) === 'cisternero' && selectedUser.cisternero && (
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Datos Cisternero</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-text-muted">RIF:</span> <span className="font-medium text-text-main">{selectedUser.cisternero.rif_personal || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-text-muted">Licencia:</span> <span className="font-medium text-text-main">{selectedUser.cisternero.licencia_conducir || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-text-muted">Balance:</span> <span className="font-bold text-status-success">${Number(selectedUser.cisternero.balance_billetera).toFixed(2)}</span></p>
                    {selectedUser.cisternero.vehiculo && (
                      <p className="flex justify-between"><span className="text-text-muted">Capacidad:</span> <span className="font-medium text-text-main">{Number(selectedUser.cisternero.vehiculo.capacidad_tanque).toLocaleString()} Lts</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(selectedUser.sanciones || []).length > 0 && (
              <div className="border-t border-border/50 pt-4">
                <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Historial de Sanciones</h4>
                <div className="flex flex-col gap-3">
                  {(selectedUser.sanciones || []).map((s) => (
                    <div key={s.id_sancion} className="bg-background-card border border-border p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-text-main">{s.motivo}</p>
                        {Number(s.monto_sancion) > 0 && <p className="text-xs font-bold text-status-error mt-1">${Number(s.monto_sancion).toFixed(2)}</p>}
                      </div>
                      <Badge variant={s.estado === 'Pagada' ? 'success' : s.estado === 'Exonerada' ? 'info' : 'warning'}>{s.estado}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cerrar
              </Button>
              {selectedUser.cuenta_inhabilitada && (
                <Button 
                  variant="success" 
                  disabled={actionLoading === selectedUser.id_usuario}
                  onClick={() => handleHabilitar(selectedUser.id_usuario)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Habilitar Cuenta
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
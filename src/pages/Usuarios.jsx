import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Users as UsersIcon, User, Truck, Shield, CheckCircle2, MoreVertical, Star, Ban, Car, CreditCard, ExternalLink, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import api from '../api/client';

const ImagePreview = ({ file }) => {
  if (!file) return null;
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    const url = URL.createObjectURL(file);
    return (
      <div className="mt-3 relative rounded-xl overflow-hidden border border-border h-48 w-full flex items-center justify-center bg-background/50 group">
        <img src={url} alt="Preview" className="object-cover h-full w-full opacity-90 transition-opacity group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-border bg-background/50 flex items-center gap-3 text-primary">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <ExternalLink size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate text-text-main">{file.name}</p>
        <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </div>
  );
};

const rolVariant = {
  'cliente': 'info',
  'cisternero': 'primary',
  'administrador': 'warning',
};

const rolLabel = {
  'cliente': 'Cliente',
  'cisternero': 'Conductor',
  'administrador': 'Admin',
  'soporte': 'Soporte',
};

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
<<<<<<< HEAD
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [editForm, setEditForm] = useState({ nombre: '', email: '', telefono: '' });
=======
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState({ isOpen: false, url: null, title: '' });
  const [newUserForm, setNewUserForm] = useState({
    nombre: '', email: '', telefono: '', password: '', rol: 'cliente',
    identificacion_fiscal: '',
    rif_personal: '', licencia_conducir: '',
    vehiculo: { marca: '', modelo: '', placa: '', capacidad_tanque: '' },
    documento_identidad: null, licencia_documento: null, foto_vehiculo: null, foto_perfil: null
  });
>>>>>>> origin/main

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
    const handleClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getRol = (u) => {
    if (u.administrador) return u.administrador.nivel_permiso === 'soporte' ? 'soporte' : 'administrador';
    if (u.cisternero) return 'cisternero';
    if (u.cliente) return 'cliente';
    return 'desconocido';
  };

  const handleHabilitar = async (id_usuario) => {
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

  const handleOpenEdit = (u) => {
    setEditModal({ isOpen: true, user: u });
    setEditForm({ nombre: u.nombre || '', email: u.email || '', telefono: u.telefono || u.phone || '' });
    setOpenDropdownId(null);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editModal.user) return;
    try {
      setActionLoading(editModal.user.id_usuario);
      await api.put(`/admin/usuarios/${editModal.user.id_usuario}`, editForm);
      setEditModal({ isOpen: false, user: null });
      fetchUsuarios();
    } catch (error) {
      alert(`Error al editar usuario: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (id_usuario) => {
    try {
      setActionLoading(id_usuario);
      await api.delete(`/admin/usuarios/${id_usuario}`);
      setDeleteModal({ isOpen: false, user: null });
      fetchUsuarios();
    } catch (error) {
      alert(`Error al eliminar usuario: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setCreatingUser(true);

      const formData = new FormData();
      formData.append('nombre', newUserForm.nombre);
      formData.append('email', newUserForm.email);
      formData.append('telefono', newUserForm.telefono);
      formData.append('password', newUserForm.password);
      formData.append('rol', newUserForm.rol);

      if (newUserForm.rol === 'cliente') {
        formData.append('identificacion_fiscal', newUserForm.identificacion_fiscal);
      } else if (newUserForm.rol === 'cisternero') {
        formData.append('rif_personal', newUserForm.rif_personal);
        formData.append('licencia_conducir', newUserForm.licencia_conducir);
        formData.append('vehiculo_marca', newUserForm.vehiculo.marca);
        formData.append('vehiculo_modelo', newUserForm.vehiculo.modelo);
        formData.append('vehiculo_placa', newUserForm.vehiculo.placa);
        formData.append('vehiculo_capacidad', newUserForm.vehiculo.capacidad_tanque);

        if (newUserForm.documento_identidad) formData.append('documento_identidad', newUserForm.documento_identidad);
        if (newUserForm.licencia_documento) formData.append('licencia_documento', newUserForm.licencia_documento);
        if (newUserForm.foto_vehiculo) formData.append('foto_vehiculo', newUserForm.foto_vehiculo);
      }

      if (newUserForm.foto_perfil) {
        formData.append('foto_perfil', newUserForm.foto_perfil);
      }

      await api.post('/admin/usuarios', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Usuario creado exitosamente');
      setShowNewUserModal(false);
      setNewUserForm({
        nombre: '', email: '', telefono: '', password: '', rol: 'cliente',
        identificacion_fiscal: '', rif_personal: '', licencia_conducir: '',
        vehiculo: { marca: '', modelo: '', placa: '', capacidad_tanque: '' },
        documento_identidad: null, licencia_documento: null, foto_vehiculo: null, foto_perfil: null
      });
      fetchUsuarios(1, pageSize, filter);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  const roles = ['Todos', 'Cliente', 'Conductor', 'Admin', 'Soporte'];
  const filtered = filter === 'Todos'
    ? usuarios
    : usuarios.filter(u => {
      const rol = getRol(u);
      return (filter === 'Cliente' && rol === 'cliente') ||
        (filter === 'Conductor' && rol === 'cisternero') ||
<<<<<<< HEAD
        (filter === 'Admin' && rol === 'administrador');
=======
        (filter === 'Admin' && rol === 'administrador') ||
        (filter === 'Soporte' && rol === 'soporte');
>>>>>>> origin/main
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
        <Button onClick={() => setShowNewUserModal(true)} className="flex items-center gap-2 px-6">
          <User size={18} /> Nuevo Usuario
        </Button>
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
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap outline-none ${isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-transparent border border-transparent text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
              >
                {rol === 'Admin' ? 'Administradores' : rol === 'Cliente' ? 'Clientes' : rol === 'Conductor' ? 'Conductores' : 'Todos'}
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

                <div className="flex justify-between items-center gap-2 relative z-10">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border overflow-hidden ${isBanned ? 'bg-background border-status-error/30 opacity-70' : 'bg-background-card border-border'}`}>
                        {u.foto_url ? (
                          <img
                            src={u.foto_url}
                            alt={u.nombre}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAvatarPreview({ isOpen: true, url: u.foto_url, title: `Foto de Perfil - ${u.nombre}` });
                            }}
                          />
                        ) : (
                          getUserIcon(rol)
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background-card ${isBanned ? 'bg-status-error' : 'bg-status-success'}`}></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base font-bold leading-tight truncate transition-colors ${isBanned ? 'text-text-muted line-through' : 'text-text-main group-hover:text-primary'}`}>
                        {u.nombre}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isBanned ? (
                      <div className="bg-status-error/10 text-status-error border border-status-error/20 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                        <Ban size={12} /> Suspendido
                      </div>
                    ) : (
                      <div className={`border px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${rol === 'cliente' ? 'bg-primary/10 text-primary border-primary/20' :
                        rol === 'cisternero' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                          'bg-status-location/10 text-status-location border-status-location/20'
                        }`}>
                        {rol === 'cisternero' ? 'conductor' : rol}
                      </div>
                    )}
                  </div>
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
                    className={`flex-1 bg-transparent border border-border py-2 rounded-lg transition-colors text-sm font-semibold flex justify-center items-center gap-2 ${isBanned ? 'hover:border-status-error/50 text-status-error hover:bg-status-error/10' : 'hover:border-primary hover:text-primary text-text-muted cursor-pointer'}`}
                  >
                    {isBanned ? 'Gestionar Estado' : 'Ver Detalles'}
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === u.id_usuario ? null : u.id_usuario); }}
                      className="w-10 h-10 flex items-center justify-center bg-transparent border border-border hover:bg-white/5 rounded-lg text-text-muted transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openDropdownId === u.id_usuario && (
                      <div
                        className="absolute bottom-full right-0 mb-2 w-36 bg-background-card border border-border rounded-lg shadow-xl py-1 z-50 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          onClick={() => { setDeleteModal({ isOpen: true, user: u }); setOpenDropdownId(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-status-error hover:bg-status-error/10 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
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
              <div className="w-16 h-16 rounded-2xl bg-background-card border border-border flex items-center justify-center overflow-hidden shrink-0">
                {selectedUser.foto_url ? (
                  <img
                    src={selectedUser.foto_url}
                    alt={selectedUser.nombre}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => {
                      setAvatarPreview({ isOpen: true, url: selectedUser.foto_url, title: `Foto de Perfil - ${selectedUser.nombre}` });
                    }}
                  />
                ) : (
                  getUserIcon(getRol(selectedUser))
                )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="min-w-0 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Contacto</h4>
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Teléfono</span>
                  <span className="font-medium text-text-main break-words">{selectedUser.telefono || selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Email</span>
                  <span className="font-medium text-text-main break-all">{selectedUser.email}</span>
                </div>
              </div>

              {getRol(selectedUser) === 'cliente' && selectedUser.cliente && (
                <div className="min-w-0 flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Datos Cliente</h4>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">RIF/CI</span>
                    <span className="font-medium text-text-main break-words">{selectedUser.cliente.identificacion_fiscal || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Billetera</span>
                    <span className="font-bold text-status-success">${Number(selectedUser.cliente.saldo_billetera).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Pedidos</span>
                    <span className="font-medium text-text-main">{selectedUser.cliente._count?.pedidos || 0}</span>
                  </div>
                </div>
              )}

              {getRol(selectedUser) === 'cisternero' && selectedUser.cisternero && (
                <div className="min-w-0 flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Datos Conductor</h4>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">RIF</span>
                    <span className="font-medium text-text-main break-words">{selectedUser.cisternero.rif_personal || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Licencia</span>
                    <span className="font-medium text-text-main break-words">{selectedUser.cisternero.licencia_conducir || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Balance</span>
                    <span className="font-bold text-status-success">${Number(selectedUser.cisternero.balance_billetera).toFixed(2)}</span>
                  </div>
                  {selectedUser.cisternero.vehiculo && (
                    <div className="flex flex-col gap-1">
                      <span className="text-text-muted text-xs uppercase font-semibold tracking-wider">Capacidad</span>
                      <span className="font-medium text-text-main">{Number(selectedUser.cisternero.vehiculo.capacidad_tanque).toLocaleString()} Lts</span>
                    </div>
                  )}
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

<<<<<<< HEAD
      {/* Modal Editar Usuario */}
      <Modal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, user: null })} title="Editar Usuario">
        <form onSubmit={handleEditUser} className="flex flex-col gap-4 mt-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-text-muted">Nombre</label>
            <input
              type="text"
              value={editForm.nombre}
              onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-text-muted">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-text-muted">Teléfono</label>
            <input
              type="text"
              value={editForm.telefono}
              onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:border-primary/50 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <Button type="button" variant="secondary" onClick={() => setEditModal({ isOpen: false, user: null })}>Cancelar</Button>
            <Button type="submit" disabled={actionLoading === editModal.user?.id_usuario}>Guardar Cambios</Button>
=======
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, id: null })}
        onConfirm={handleHabilitar}
        title="Habilitar Cuenta"
        message="¿Estás seguro de que deseas habilitar esta cuenta? El usuario podrá volver a acceder al sistema."
        variant="success"
      />

      {/* Modal Nuevo Usuario */}
      <Modal isOpen={showNewUserModal} onClose={() => setShowNewUserModal(false)} title="Registrar Nuevo Usuario" maxWidth="max-w-6xl">
        <form onSubmit={handleCreateUser} className="flex flex-col gap-6 mt-4">

          <div className="bg-background/30 p-6 rounded-2xl border border-border/50">
            <h4 className="text-base font-bold text-primary mb-6 flex items-center gap-2">
              <User size={18} /> Datos Principales
            </h4>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Columna Izquierda: Uploader Circular del Avatar */}
              <div className="flex flex-col items-center gap-3 shrink-0 w-full lg:w-36">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider text-center">Foto de Perfil</span>
                <div
                  onClick={() => document.getElementById('avatar-upload-input').click()}
                  className="relative w-28 h-28 rounded-full border-2 border-dashed border-primary/30 hover:border-primary/60 bg-background-card/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                >
                  {newUserForm.foto_perfil ? (
                    <img
                      src={URL.createObjectURL(newUserForm.foto_perfil)}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-text-muted group-hover:text-primary transition-colors p-3 text-center">
                      <User size={28} className="opacity-50 group-hover:opacity-80 transition-opacity mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Subir Foto</span>
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <User size={20} className="text-white mb-0.5" />
                    <span className="text-[9px] text-white font-bold uppercase tracking-wider">Cambiar</span>
                  </div>
                </div>
                <input
                  id="avatar-upload-input"
                  type="file" accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => setNewUserForm({ ...newUserForm, foto_perfil: e.target.files[0] })}
                />
                <p className="text-[10px] text-text-muted text-center max-w-[120px]">Formatos: JPG, PNG o WEBP (opcional)</p>
              </div>

              {/* Columna Derecha: Campos del Formulario */}
              <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-text-muted">Rol del Usuario</label>
                  <select
                    value={newUserForm.rol}
                    onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-primary outline-none transition-colors"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="cisternero">Conductor</option>
                    <option value="administrador">Administrador</option>
                    <option value="soporte">Soporte</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-semibold text-text-muted">Nombre Completo</label>
                  <input
                    type="text" required
                    value={newUserForm.nombre}
                    onChange={(e) => setNewUserForm({ ...newUserForm, nombre: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-primary outline-none transition-colors"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-text-muted">Correo Electrónico</label>
                  <input
                    type="email" required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-primary outline-none transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-text-muted">Teléfono</label>
                  <input
                    type="tel" required
                    value={newUserForm.telefono}
                    onChange={(e) => setNewUserForm({ ...newUserForm, telefono: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-primary outline-none transition-colors"
                    placeholder="Ej. 04141234567"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-text-muted">Contraseña Temporal</label>
                  <input
                    type="password" required minLength="6"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-primary outline-none transition-colors"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Campos Dinámicos */}
          {newUserForm.rol === 'cliente' && (
            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 animate-fade-in">
              <h4 className="text-base font-bold text-primary mb-4">Información Fiscal</h4>
              <div className="flex flex-col gap-1 max-w-md">
                <label className="text-sm font-semibold text-text-muted">RIF / Cédula de Identidad <span className="text-status-error">*</span></label>
                <input
                  type="text" required
                  value={newUserForm.identificacion_fiscal}
                  onChange={(e) => setNewUserForm({ ...newUserForm, identificacion_fiscal: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-primary outline-none transition-colors"
                  placeholder="Ej. J-123456789"
                />
              </div>
            </div>
          )}

          {newUserForm.rol === 'cisternero' && (
            <div className="bg-status-warning/5 p-5 rounded-2xl border border-status-warning/20 animate-fade-in">
              <h4 className="text-base font-bold text-status-warning mb-4 flex items-center gap-2">
                <Truck size={18} /> Datos del Conductor y Vehículo
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado Izquierdo: Formularios de Texto */}
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-text-muted">RIF Personal <span className="text-status-error">*</span></label>
                      <input
                        type="text" required
                        value={newUserForm.rif_personal}
                        onChange={(e) => setNewUserForm({ ...newUserForm, rif_personal: e.target.value })}
                        className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-status-warning outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-text-muted">Licencia de Conducir <span className="text-status-error">*</span></label>
                      <input
                        type="text" required
                        value={newUserForm.licencia_conducir}
                        onChange={(e) => setNewUserForm({ ...newUserForm, licencia_conducir: e.target.value })}
                        className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-status-warning outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/50 bg-background/50">
                    <h5 className="text-sm font-bold text-text-main mb-3">Especificaciones del Camión</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-text-muted">Marca <span className="text-status-error">*</span></label>
                        <input
                          type="text" required
                          value={newUserForm.vehiculo.marca}
                          onChange={(e) => setNewUserForm({ ...newUserForm, vehiculo: { ...newUserForm.vehiculo, marca: e.target.value } })}
                          className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-status-warning outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-text-muted">Modelo <span className="text-status-error">*</span></label>
                        <input
                          type="text" required
                          value={newUserForm.vehiculo.modelo}
                          onChange={(e) => setNewUserForm({ ...newUserForm, vehiculo: { ...newUserForm.vehiculo, modelo: e.target.value } })}
                          className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-status-warning outline-none transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-text-muted">Placa <span className="text-status-error">*</span></label>
                        <input
                          type="text" required
                          value={newUserForm.vehiculo.placa}
                          onChange={(e) => setNewUserForm({ ...newUserForm, vehiculo: { ...newUserForm.vehiculo, placa: e.target.value } })}
                          className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-status-warning outline-none transition-colors uppercase"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-text-muted">Capacidad (Lts) <span className="text-status-error">*</span></label>
                        <input
                          type="number" required min="1"
                          value={newUserForm.vehiculo.capacidad_tanque}
                          onChange={(e) => setNewUserForm({ ...newUserForm, vehiculo: { ...newUserForm.vehiculo, capacidad_tanque: e.target.value } })}
                          className="px-4 py-2.5 rounded-xl bg-background-card border border-border text-text-main focus:border-status-warning outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Archivos y Previews */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1 bg-background-card p-4 rounded-xl border border-border">
                    <label className="text-sm font-bold text-text-main">Foto de Cédula / Identidad <span className="text-status-error">*</span></label>
                    <p className="text-xs text-text-muted mb-2">Sube una foto clara del documento, en formato JPG, PNG o PDF.</p>
                    <input
                      type="file" required accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setNewUserForm({ ...newUserForm, documento_identidad: e.target.files[0] })}
                      className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-status-warning/10 file:text-status-warning hover:file:bg-status-warning/20 transition-colors cursor-pointer"
                    />
                    <ImagePreview file={newUserForm.documento_identidad} />
                  </div>

                  <div className="flex flex-col gap-1 bg-background-card p-4 rounded-xl border border-border">
                    <label className="text-sm font-bold text-text-main">Foto de Licencia de Conducir <span className="text-status-error">*</span></label>
                    <p className="text-xs text-text-muted mb-2">Debe estar vigente y ser legible.</p>
                    <input
                      type="file" required accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setNewUserForm({ ...newUserForm, licencia_documento: e.target.files[0] })}
                      className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-status-warning/10 file:text-status-warning hover:file:bg-status-warning/20 transition-colors cursor-pointer"
                    />
                    <ImagePreview file={newUserForm.licencia_documento} />
                  </div>

                  <div className="flex flex-col gap-1 bg-background-card p-4 rounded-xl border border-border">
                    <label className="text-sm font-bold text-text-main">Foto del Vehículo <span className="text-status-error">*</span></label>
                    <p className="text-xs text-text-muted mb-2">Foto visible y legible del camión cisterna.</p>
                    <input
                      type="file" required accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setNewUserForm({ ...newUserForm, foto_vehiculo: e.target.files[0] })}
                      className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-status-warning/10 file:text-status-warning hover:file:bg-status-warning/20 transition-colors cursor-pointer"
                    />
                    <ImagePreview file={newUserForm.foto_vehiculo} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setShowNewUserModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={creatingUser}>
              {creatingUser ? 'Creando...' : 'Crear Usuario'}
            </Button>
>>>>>>> origin/main
          </div>
        </form>
      </Modal>

<<<<<<< HEAD
      {/* Modal Eliminar Usuario */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, user: null })} title="Eliminar Usuario">
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-sm text-text-muted">
            ¿Estás seguro de que deseas eliminar a <strong>{deleteModal.user?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false, user: null })}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteUser(deleteModal.user.id_usuario)}
              disabled={actionLoading === deleteModal.user?.id_usuario}
            >
              Eliminar
=======
      {/* Modal de Previsualización de Foto de Perfil */}
      <Modal
        isOpen={avatarPreview.isOpen}
        onClose={() => setAvatarPreview({ isOpen: false, url: null, title: '' })}
        title={avatarPreview.title}
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {avatarPreview.url && (
            <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden border border-border bg-background/50 flex items-center justify-center">
              <img
                src={avatarPreview.url}
                alt="Avatar"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          )}
          <div className="flex justify-end w-full pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setAvatarPreview({ isOpen: false, url: null, title: '' })}>
              Cerrar
>>>>>>> origin/main
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
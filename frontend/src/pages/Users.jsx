import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
    Users as UsersIcon, Shield, ShoppingBag, Trash2, Plus,
    Eye, EyeOff, AlertCircle, CheckCircle, Building2,
    UserCheck, UserX, RefreshCw, ChevronDown, X,
    Edit3, Key, Search, MoreVertical, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ROL_CONFIG = {
    admin: { label: 'Administrador', color: 'bg-primary-50 text-primary-600 border-primary-100', icon: Shield },
    vendedor: { label: 'Vendedor', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShoppingBag },
};

const TABS = [
    { id: 'miembros', label: 'Miembros del Equipo', icon: UsersIcon },
    { id: 'accesos', label: 'Consola de Accesos', icon: Building2 },
];

const inputCls = 'w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:font-medium disabled:opacity-50';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const RolBadge = ({ rol }) => {
    const cfg = ROL_CONFIG[rol] || { label: rol, color: 'bg-slate-50 text-slate-500 border-slate-100', icon: Shield };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}>
            <Icon size={10} /> {cfg.label}
        </span>
    );
};

// Modal de Confirmación genérico (reemplaza window.confirm)
const ConfirmModal = ({ show, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!show) return null;
    const isDanger = type === 'danger';
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-3xl flex items-center justify-center ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-primary-50 text-primary-500'}`}>
                        {isDanger ? <AlertCircle size={32} /> : <CheckCircle size={32} />}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">{title}</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{message}</p>
                </div>
                <div className="px-8 pb-8 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                    >
                        Volver
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-soft active:scale-95 ${isDanger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary-600 hover:bg-primary-700'}`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const Users = () => {
    const { user: me } = useAuth();
    const isAdmin = me?.rol?.toLowerCase() === 'admin';

    // Estados de datos
    const [tab, setTab] = useState('miembros');
    const [users, setUsers] = useState([]);
    const [globalUsers, setGlobalUsers] = useState([]);
    const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados de Modales
    const [modalUser, setModalUser] = useState(null); // { type: 'create' | 'edit' | 'reset' | 'access', user?: obj }
    const [confirmAction, setConfirmAction] = useState(null); // { title, message, onConfirm, type }

    // Estados de formularios
    const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' });
    const [accesoData, setAccesoData] = useState({ empresa_id: '', rol: 'vendedor' });
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ── Carga de Datos ───────────────────────────────────────────────

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth');
            setUsers(res.data);
        } catch (err) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmpresas = useCallback(async () => {
        try {
            const res = await api.get('/auth/empresas-disponibles');
            setEmpresasDisponibles(res.data);
        } catch (err) {
            console.error('Error cargando empresas:', err);
        }
    }, []);

    const fetchGlobalUsers = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/auth/global');
            setGlobalUsers(res.data);
        } catch (err) {
            console.error('Error cargando usuarios globales:', err);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchUsers();
        if (isAdmin) {
            fetchEmpresas();
            fetchGlobalUsers();
        }
    }, [fetchUsers, fetchEmpresas, fetchGlobalUsers, isAdmin]);

    // Filtrado local
    const filteredUsers = useMemo(() => {
        const source = tab === 'miembros' ? users : globalUsers;
        if (!searchTerm) return source;
        const low = searchTerm.toLowerCase();
        return source.filter(u =>
            (u.nombre && String(u.nombre).toLowerCase().includes(low)) ||
            (u.email && String(u.email).toLowerCase().includes(low))
        );
    }, [users, globalUsers, tab, searchTerm]);

    // ── Handlers ───────────────────────────────────────────────────

    const closeModals = () => {
        setModalUser(null);
        setFormData({ nombre: '', email: '', password: '', rol: 'vendedor' });
        setAccesoData({ empresa_id: '', rol: 'vendedor' });
        setShowPassword(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/auth/users', formData);
            toast.success('Usuario creado exitosamente');
            closeModals();
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear usuario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/auth/${modalUser.user.id}`, { nombre: formData.nombre, email: formData.email });
            toast.success('Perfil actualizado');
            closeModals();
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al actualizar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/auth/${modalUser.user.id}/reset-password`, { nuevaPassword: formData.password });
            toast.success('Contraseña reestablecida correctamente');
            closeModals();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al reestablecer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const u = users.find(x => x.id === userId);
        setConfirmAction({
            title: 'Cambiar Rol',
            message: `¿Estás seguro de cambiar el rol de ${u.nombre} a ${ROL_CONFIG[newRole].label}?`,
            type: 'info',
            onConfirm: async () => {
                try {
                    await api.put(`/auth/${userId}/rol`, { rol: newRole });
                    toast.success('Rol actualizado');
                    fetchUsers();
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Error al actualizar');
                }
                setConfirmAction(null);
            }
        });
    };

    const handleRevocar = async (userId) => {
        const u = users.find(x => x.id === userId);
        setConfirmAction({
            title: 'Revocar Acceso',
            message: `¿Deseas quitar el acceso de ${u.nombre} a esta empresa? La cuenta seguirá existiendo en el sistema.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/auth/${userId}`);
                    toast.success('Acceso revocado');
                    fetchUsers();
                } catch (err) {
                    toast.error(err.response?.data?.error || 'Error al revocar');
                }
                setConfirmAction(null);
            }
        });
    };

    const handleDarAcceso = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/auth/${modalUser.user.id}/empresas`, accesoData);
            toast.success('Acceso otorgado correctamente');
            closeModals();
            fetchUsers(); // Actualiza conteo de empresas
            fetchGlobalUsers(); // Actualiza tabla global
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al otorgar acceso');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Agrupación de datos para Acceso Global ─────────────────────
    const groupedGlobalUsers = useMemo(() => {
        const groups = {};
        globalUsers.forEach(u => {
            if (!groups[u.id]) {
                groups[u.id] = {
                    id: u.id,
                    nombre: u.nombre,
                    email: u.email,
                    membresias: []
                };
            }
            groups[u.id].membresias.push({
                empresa_id: u.empresa_id,
                empresa_nombre: u.empresa_nombre,
                rol: u.rol,
                fecha_union: u.fecha_union
            });
        });
        return Object.values(groups);
    }, [globalUsers]);

    // ── Render Helpers ─────────────────────────────────────────────

    const ActionButton = ({ icon: Icon, onClick, title, color = 'text-gray-400 hover:text-indigo-600', bg = 'hover:bg-indigo-50' }) => (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${color} ${bg}`}
        >
            <Icon size={16} />
        </button>
    );

    // ── Render Principal ───────────────────────────────────────────

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">

            {/* Header / Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <UsersIcon className="text-primary-600" size={32} />
                        Gestión de Capital Humano
                    </h1>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1 ml-11">
                        Control de Privilegios y Accesos Multi-Empresa
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por identidad o correo..."
                            className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setModalUser({ type: 'create' }); setFormData({ nombre: '', email: '', password: '', rol: 'vendedor' }); }}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-95"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">Nuevo Operador</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="premium-card !p-0 overflow-hidden">
                <div className="bg-surface-50/50 px-8 pt-2 border-b border-slate-100 flex items-center justify-between">
                    <nav className="flex gap-10">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-2.5 py-5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all relative ${active
                                        ? 'text-primary-600 border-primary-600'
                                        : 'text-slate-400 border-transparent hover:text-slate-600'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {t.label}
                                    {active && <span className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-primary-600 rounded-full"></span>}
                                </button>
                            );
                        })}
                    </nav>
                    <button
                        onClick={() => { fetchUsers(); if (isAdmin) fetchGlobalUsers(); }}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Refrescar datos"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Nómina...</p>
                    </div>
                ) : (tab === 'miembros' ? users : groupedGlobalUsers).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-16 h-16 bg-surface-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100">
                            <UsersIcon size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin registros disponibles</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-10 py-5">Perfil / Usuario</th>
                                    <th className="px-10 py-5">
                                        {tab === 'miembros' ? 'Membresía Activa' : 'Ecosistema de Empresas'}
                                    </th>
                                    <th className="px-6 py-5">Consola/Estado</th>
                                    <th className="px-10 py-5 text-right">Mantenimiento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(tab === 'miembros' ? users : groupedGlobalUsers).map(u => (
                                    <tr key={u.id} className="hover:bg-primary-50/20 transition-colors group">
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-soft group-hover:scale-105 transition-transform">
                                                    {u.nombre?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{u.nombre}</span>
                                                        {u.id === me?.id && (
                                                            <span className="text-[9px] font-black uppercase tracking-tighter bg-primary-100 text-primary-700 px-2 py-0.5 rounded-lg border border-primary-200">Sesión Actual</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 font-bold block mt-1 lowercase">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            {tab === 'miembros' ? (
                                                <div className="flex flex-col gap-2">
                                                    {isAdmin && u.id !== me?.id ? (
                                                        <div className="relative w-max">
                                                            <select
                                                                value={u.rol}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                className={`appearance-none pr-10 pl-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all border ${ROL_CONFIG[u.rol]?.color || 'bg-slate-50'}`}
                                                            >
                                                                {Object.entries(ROL_CONFIG).map(([val, cfg]) => (
                                                                    <option key={val} value={val}>{cfg.label.toUpperCase()}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                                        </div>
                                                    ) : (
                                                        <RolBadge rol={u.rol} />
                                                    )}
                                                    {u.num_empresas > 1 && (
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-indigo-500 bg-indigo-50 w-max px-2.5 py-1 rounded-lg border border-indigo-100">
                                                            <Building2 size={10} /> +{u.num_empresas - 1} empresas adicionales
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {u.membresias.map(m => (
                                                        <div key={m.empresa_id} className="bg-surface-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-3 hover:border-primary-200 transition-all group/mb">
                                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary-500 border border-slate-50 shadow-sm">
                                                                <Building2 size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{m.empresa_nombre}</p>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${ROL_CONFIG[m.rol]?.color || 'bg-slate-50'}`}>
                                                                        {m.rol}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-slate-400">{new Date(m.fecha_union).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                    Activo
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase ml-3.5 tracking-tighter">Acceso Certificado</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {isAdmin && u.id !== me?.id ? (
                                                    <>
                                                        <ActionButton
                                                            icon={Edit3}
                                                            onClick={() => { setModalUser({ type: 'edit', user: u }); setFormData({ nombre: u.nombre, email: u.email }); }}
                                                            title="Editar Perfil"
                                                            color="text-slate-400 hover:text-primary-600"
                                                            bg="hover:bg-primary-50"
                                                        />
                                                        <ActionButton
                                                            icon={Key}
                                                            onClick={() => { setModalUser({ type: 'reset', user: u }); setFormData({ password: '' }); }}
                                                            title="Contraseña"
                                                            color="text-slate-400 hover:text-amber-500"
                                                            bg="hover:bg-amber-50"
                                                        />
                                                        <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>
                                                        <ActionButton
                                                            icon={UserCheck}
                                                            onClick={() => { setModalUser({ type: 'access', user: u }); setAccesoData({ empresa_id: '', rol: 'vendedor' }); }}
                                                            title="Plus Access"
                                                            color="text-emerald-500 hover:text-emerald-700"
                                                            bg="hover:bg-emerald-100/50"
                                                        />
                                                        <ActionButton
                                                            icon={UserX}
                                                            onClick={() => handleRevocar(u.id)}
                                                            title="Baja"
                                                            color="text-rose-400 hover:text-rose-600"
                                                            bg="hover:bg-rose-50"
                                                        />
                                                    </>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest px-4">Solo Lectura</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Banner de Info */}
            <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-primary-500/20 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                            <Shield size={20} className="text-primary-400" />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter uppercase tracking-widest text-[14px]">Arquitectura de Roles Senior</h3>
                    </div>
                    <p className="text-slate-300 text-xs max-w-xl leading-relaxed font-medium">
                        Los privilegios son granulares e independientes por entorno. Un usuario puede ejercer como <b className="text-white">Admin</b> en la matriz y <b className="text-white">Vendedor</b> en delegaciones.
                        La revocación de acceso <b className="text-primary-400 font-black">protege la integridad</b> de la cuenta global.
                    </p>
                </div>
                <div className="flex gap-4 shrink-0 relative z-10 w-full md:w-auto">
                    <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 text-center min-w-[120px]">
                        <span className="block text-3xl font-black mb-1">{users.length}</span>
                        <span className="text-[9px] uppercase font-black tracking-[0.2em] text-primary-400">Operadores</span>
                    </div>
                    <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 text-center min-w-[120px]">
                        <span className="block text-3xl font-black mb-1">{users.filter(u => u.rol === 'admin').length}</span>
                        <span className="text-[9px] uppercase font-black tracking-[0.2em] text-primary-400">Directores</span>
                    </div>
                </div>
            </div>

            {/* ── MODALES RE-DISEÑADOS ────────────────────────────────── */}

            {
                modalUser && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModals}></div>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in slide-in-from-bottom-12 duration-500">
                            {/* Modal Header */}
                            <div className="px-10 pt-10 pb-6 flex items-center justify-between border-b border-slate-50 bg-surface-50/30">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {modalUser.type === 'create' && 'Registrar Operador'}
                                        {modalUser.type === 'edit' && 'Actualizar Perfil'}
                                        {modalUser.type === 'reset' && 'Control de Credenciales'}
                                        {modalUser.type === 'access' && 'Expansión de Acceso'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                                        {modalUser.user ? `Identidad: ${modalUser.user.nombre}` : 'Seguridad del Sistema'}
                                    </p>
                                </div>
                                <button onClick={closeModals} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all shadow-sm text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-10">
                                <form className="space-y-6" onSubmit={
                                    modalUser.type === 'create' ? handleCreateUser :
                                        modalUser.type === 'edit' ? handleEditUser :
                                            modalUser.type === 'reset' ? handleResetPassword :
                                                handleDarAcceso
                                }>

                                    {/* Campos dinámicos según el tipo de modal */}
                                    {(modalUser.type === 'create' || modalUser.type === 'edit') && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alias / Nombre Completo</label>
                                                <input required className={inputCls} placeholder="Ej: Staff Corporativo" value={formData.nombre} onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Correo Institucional</label>
                                                <input type="email" required className={inputCls} placeholder="staff@empresa.com" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                                            </div>
                                        </>
                                    )}

                                    {(modalUser.type === 'create' || modalUser.type === 'reset') && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Llave de Seguridad</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    minLength={8}
                                                    className={`${inputCls} pr-14`}
                                                    placeholder="Fortaleza requerida"
                                                    value={formData.password}
                                                    onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary-600 transition-colors">
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {modalUser.type === 'create' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nivel de Privilegios</label>
                                            <div className="relative">
                                                <select className={`${inputCls} appearance-none pr-10`} value={formData.rol} onChange={e => setFormData(f => ({ ...f, rol: e.target.value }))}>
                                                    {Object.entries(ROL_CONFIG).map(([v, c]) => (
                                                        <option key={v} value={v}>{c.label.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                            </div>
                                        </div>
                                    )}

                                    {modalUser.type === 'access' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ecosistema Destino</label>
                                                <div className="relative">
                                                    <select
                                                        required
                                                        className={`${inputCls} appearance-none pr-10`}
                                                        value={accesoData.empresa_id}
                                                        onChange={e => setAccesoData(a => ({ ...a, empresa_id: e.target.value }))}
                                                    >
                                                        <option value="">Seleccionar Sucursal / Empresa...</option>
                                                        {empresasDisponibles.map(emp => (
                                                            <option key={emp.id} value={emp.id}>{emp.nombre.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rol Proyectado</label>
                                                <div className="relative">
                                                    <select className={`${inputCls} appearance-none pr-10`} value={accesoData.rol} onChange={e => setAccesoData(a => ({ ...a, rol: e.target.value }))}>
                                                        {Object.entries(ROL_CONFIG).map(([v, c]) => (
                                                            <option key={v} value={v}>{c.label.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Modal Footer */}
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-14 flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-soft active:scale-95 disabled:grayscale"
                                        >
                                            {submitting ? (
                                                <RefreshCw size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    {modalUser.type === 'access' && <UserCheck size={20} />}
                                                    {modalUser.type === 'edit' && <Edit3 size={20} />}
                                                    {modalUser.type === 'reset' && <Key size={20} />}
                                                    {modalUser.type === 'create' && <Plus size={20} />}
                                                    Ejecutar Cambios
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            <ConfirmModal
                show={!!confirmAction}
                {...confirmAction}
                onCancel={() => setConfirmAction(null)}
            />

        </div >
    );
};

export default Users;

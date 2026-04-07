// frontend/src/pages/SuperAdminPanel.jsx
// Panel global para SuperAdministrador — v1.28.2
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
    Shield, Building2, Users, Crown, CreditCard, RefreshCw,
    ChevronDown, Check, AlertTriangle, Globe, BarChart3, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PLAN_COLORS = {
    1: 'bg-gray-100 text-gray-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-orange-100 text-orange-700',
    4: 'bg-purple-100 text-purple-700',
    5: 'bg-amber-100 text-amber-700',
};

const StatCard = ({ icon: Icon, label, value, color = 'indigo' }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
        <div className={`bg-${color}-50 p-3 rounded-xl shrink-0`}>
            <Icon size={22} className={`text-${color}-600`} />
        </div>
        <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        </div>
    </div>
);

const SuperAdminPanel = () => {
    const { user } = useAuth();
    const [empresas, setEmpresas] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [changingPlan, setChangingPlan] = useState({});

    // Guardia: solo superadmin puede ver esta página
    if (!user || user.rol !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertTriangle size={48} className="text-red-400" />
                <h2 className="text-xl font-bold text-gray-800">Acceso Restringido</h2>
                <p className="text-gray-500">Solo el SuperAdministrador puede acceder a este panel.</p>
            </div>
        );
    }

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [empRes, planRes, statsRes] = await Promise.all([
                api.get('/superadmin/empresas'),
                api.get('/superadmin/planes'),
                api.get('/superadmin/stats'),
            ]);
            setEmpresas(empRes.data);
            setPlanes(planRes.data);
            setStats(statsRes.data);
        } catch (err) {
            toast.error('Error al cargar datos del panel global');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handlePlanChange = async (empresaId, nuevoPlanId) => {
        setChangingPlan(prev => ({ ...prev, [empresaId]: true }));
        try {
            await api.put(`/superadmin/empresas/${empresaId}/plan`, { plan_id: nuevoPlanId });
            toast.success('Plan actualizado correctamente');
            setEmpresas(prev => prev.map(e =>
                e.id === empresaId
                    ? { ...e, plan_id: nuevoPlanId, plan_nombre: planes.find(p => p.id === nuevoPlanId)?.nombre || '' }
                    : e
            ));
        } catch {
            toast.error('Error al actualizar el plan');
        } finally {
            setChangingPlan(prev => ({ ...prev, [empresaId]: false }));
        }
    };

    const filtered = empresas.filter(e =>
        !search || e.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/10 p-2.5 rounded-xl">
                        <Shield size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Panel SuperAdministrador</h1>
                        <p className="text-slate-300 text-sm">Gestión global de la plataforma TB Gestión</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="bg-white/10 px-3 py-1 rounded-full">👤 {user.nombre}</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full">🌐 Acceso Global</span>
                    <span className="bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full font-semibold">⚡ SuperAdmin</span>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Building2} label="Empresas" value={stats.total_empresas} color="indigo" />
                    <StatCard icon={Users} label="Usuarios" value={stats.total_usuarios} color="blue" />
                    <StatCard icon={CreditCard} label="Facturas" value={stats.total_facturas} color="green" />
                    <StatCard icon={Package} label="Productos" value={stats.total_productos} color="orange" />
                </div>
            )}

            {/* Tabla de empresas */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Empresas y Planes</h2>
                        <p className="text-xs text-gray-500">Gestión de planes por empresa — {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-52"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button
                            onClick={fetchAll}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            title="Actualizar"
                        >
                            <RefreshCw size={16} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Usuarios</th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Facturas</th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Plan Actual</th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Cambiar Plan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{e.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <Building2 size={14} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{e.nombre}</p>
                                                    <p className="text-xs text-gray-400">{e.documento_identidad}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{e.email || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className="inline-flex items-center gap-1 text-gray-600">
                                                <Users size={12} /> {e.total_usuarios}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{e.total_facturas}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_COLORS[e.plan_id] || 'bg-gray-100 text-gray-600'}`}>
                                                <Crown size={10} />
                                                {e.plan_nombre || 'Sin plan'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <select
                                                    disabled={changingPlan[e.id]}
                                                    value={e.plan_id || ''}
                                                    onChange={ev => handlePlanChange(e.id, parseInt(ev.target.value))}
                                                    className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:opacity-50 cursor-pointer"
                                                >
                                                    <option value="">Sin plan</option>
                                                    {planes.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                                            No se encontraron empresas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Planes disponibles */}
            {planes.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Planes del Sistema</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {planes.map(p => {
                            const mods = p.modulos && p.modulos['*'] ? ['Acceso completo (*)'] : Object.keys(p.modulos || {}).filter(k => p.modulos[k]);
                            return (
                                <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Crown size={16} className="text-amber-500" />
                                        <span className="font-bold text-gray-900 text-sm">{p.nombre}</span>
                                        <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">id:{p.id}</span>
                                    </div>
                                    {p.descripcion && <p className="text-xs text-gray-400 mb-2">{p.descripcion}</p>}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {mods.slice(0, 6).map(m => (
                                            <span key={m} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
                                                {m.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                        {mods.length > 6 && (
                                            <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">
                                                +{mods.length - 6} más
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPanel;

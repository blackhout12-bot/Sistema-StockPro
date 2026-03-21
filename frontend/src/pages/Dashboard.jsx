import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import {
    Package, AlertTriangle, DollarSign, ShoppingCart,
    TrendingUp, FileText, RefreshCw, BarChart2, Zap, Users, History, CheckCircle, ArrowRight, Building2, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, BarChart, Bar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import RubroShowcaseCard from '../components/RubroShowcaseCard';

// ─── Componentes Auxiliares ────────────────────────────────────────
const MiniKpi = ({ icon: Icon, label, value, sub, colorClass, iconColor }) => (
    <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-xl">
        <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-20`}>
            <Icon size={24} className={iconColor} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-brand-dark tracking-tight leading-none my-1">{value}</p>
            {sub && <p className="text-[10px] font-bold text-slate-500">{sub}</p>}
        </div>
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-brand-50 p-2 rounded-xl text-brand-600 border border-brand-100">
                <Icon size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-brand-dark tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1 ml-11 font-medium">{subtitle}</p>}
    </div>
);

// ─── Main Dashboard ──────────────────────────────────────────
const Dashboard = () => {
    const { token } = useAuth();
    const { sucursalActiva, sucursales } = useBranch();
    const [branchVentas, setBranchVentas] = useState([]);
    
    const { data: dashData, isLoading: loading, refetch: fetchAll } = useQuery({
        queryKey: ['dashboard', 'main-stats'],
        enabled: !!token,
        staleTime: 5 * 60 * 1000, 
        queryFn: async () => {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const today = now.toISOString().slice(0, 10);

            const [prodRes, actRes, factRes, topRes, confRes, statsRes] = await Promise.allSettled([
                api.get('/productos'),
                api.get('/movimientos/recientes'),
                api.get('/facturacion'),
                api.get(`/reportes/ventas-producto?fechaInicio=${monthStart}&fechaFin=${today}`),
                api.get('/empresa/configuracion/completa'),
                api.get('/empresa/resumen')
            ]);

            const configPayload = confRes.status === 'fulfilled' ? confRes.value.data : null;
            if (configPayload) {
                const pendingData = configPayload.dash_kpis_visibles || '[]';
                if (localStorage.getItem('dash_kpis') !== pendingData) localStorage.setItem('dash_kpis', pendingData);
            }

            return {
                products: prodRes.status === 'fulfilled' ? prodRes.value.data : [],
                recentActivity: actRes.status === 'fulfilled' ? actRes.value.data.slice(0, 8) : [],
                recentFacturas: factRes.status === 'fulfilled' ? factRes.value.data.slice(0, 6) : [],
                topProducts: topRes.status === 'fulfilled' ? topRes.value.data.sort((a, b) => b.total_ventas - a.total_ventas).slice(0, 5) : [],
                config: configPayload,
                stats: statsRes.status === 'fulfilled' ? statsRes.value.data : null,
                lastUpdated: new Date().toLocaleTimeString()
            };
        }
    });

    useEffect(() => {
        if (!token || sucursales.length < 2) return;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const today = now.toISOString().slice(0, 10);
        Promise.all(
            sucursales.map(s =>
                api.get(`/facturacion?sucursal_id=${s.id}&fechaInicio=${monthStart}&fechaFin=${today}`)
                    .then(r => ({ sucursal: s.nombre, total: (r.data || []).reduce((sum, f) => sum + Number(f.total || 0), 0), cantidad: (r.data || []).length }))
                    .catch(() => ({ sucursal: s.nombre, total: 0, cantidad: 0 }))
            )
        ).then(setBranchVentas);
    }, [token, sucursales]);

    const { products = [], recentActivity = [], recentFacturas = [], topProducts = [], config = null, stats = null, lastUpdated = null } = dashData || {};

    const totalProducts = stats?.total_productos ?? (Array.isArray(products) ? products.length : 0);
    const lowStockItems = Array.isArray(products) ? products.filter(p => p.stock <= 5 && p.stock >= 0) : [];
    const totalValue = stats?.valor_inventario ?? (Array.isArray(products) ? products.reduce((s, p) => s + (p.precio || 0) * (p.stock || 0), 0) : 0);
    const totalFacturasSales = stats?.ventas_totales ?? (Array.isArray(recentFacturas) ? recentFacturas.reduce((s, f) => s + Number(f.total || 0), 0) : 0);
    const totalPagosSales = stats?.monto_pagos ?? 0;
    const totalSales = totalFacturasSales + totalPagosSales;
    const totalClientes = stats?.total_clientes ?? 0;
    const totalMovimientos = stats?.total_movimientos ?? (Array.isArray(recentActivity) ? recentActivity.length : 0);

    const formatMoney = (val) => `${config?.simbolo_moneda || '$'}${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

    return (
        <div className="h-full relative overflow-x-hidden min-h-screen">
            {/* Scrollable Content Area. Pad bottom to make space for the fixed KPI dock */}
            <div className="pb-44 animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark tracking-tighter drop-shadow-sm">Panel de Gestión</h1>
                        <p className="text-sm text-slate-500 mt-1 font-bold">
                            {lastUpdated ? `Última sincronización: ${lastUpdated}` : 'Consultando almacén...'}
                        </p>
                    </div>
                    <button
                        onClick={fetchAll} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-base text-white text-[11px] font-black tracking-widest uppercase rounded-xl hover:bg-brand-dark transition shadow-lg shadow-brand-base/30 disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refrescar
                    </button>
                </div>

                {/* FASE 2: Tarjetas Dinámicas por Rubro (Showcase) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 mb-12">
                    {topProducts.length > 0 ? (
                        topProducts.slice(0, 3).map(prod => (
                            <RubroShowcaseCard 
                                key={prod.id} 
                                producto={prod} 
                                rubro={config?.rubro || 'general'} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full h-48 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">
                            <p className="text-sm font-bold text-slate-400">Sin productos comerciales suficientes para exhibición</p>
                        </div>
                    )}
                </div>

                {/* Resto del contenido original (Tablas, Movimientos, Sucursales) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                    {branchVentas.length >= 2 && (
                        <div className="lg:col-span-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-100">
                            <SectionHeader icon={Building2} title="Estado de Sucursales" subtitle="Ventas del mes por punto de venta." />
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={branchVentas} margin={{ top: 0, right: 10, bottom: 20, left: 0 }}>
                                        <XAxis dataKey="sucursal" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip formatter={(v) => [formatMoney(v), 'Ventas']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                                            {branchVentas.map((entry, i) => (
                                                <Cell key={i} fill={sucursalActiva?.nombre === entry.sucursal ? '#2563eb' : '#94a3b8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {!branchVentas || branchVentas.length < 2 && (
                        <div className="lg:col-span-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-100">
                            <SectionHeader icon={History} title="Actividad Reciente" subtitle="Trazabilidad de entradas y salidas." />
                            <div className="space-y-4">
                                {recentActivity.length === 0 ? (
                                    <p className="text-xs text-slate-300 font-bold py-10 text-center">Histororial vacío</p>
                                ) : (
                                    recentActivity.slice(0, 4).map((mov, i) => {
                                        const isEntrada = mov.tipo?.toLowerCase() === 'entrada';
                                        return (
                                            <div key={mov.id || i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEntrada ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {isEntrada ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-extrabold text-slate-800 truncate uppercase tracking-tight">{mov.producto}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Cant: {isEntrada ? '+' : '-'}{mov.cantidad}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    <div className="lg:col-span-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                        <SectionHeader icon={AlertTriangle} title="Reposición" subtitle="Prioridad alta por reserva." />
                        {lowStockItems.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-200 py-10">
                                <CheckCircle size={56} className="text-emerald-400 mb-4 opacity-40" />
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Stock Asegurado</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto pr-1 max-h-[300px] custom-scrollbar">
                                {lowStockItems.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100/50">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black bg-rose-500`}>
                                            {p.stock}
                                        </div>
                                        <div className="min-w-0 mr-2 flex-1">
                                            <p className="text-[11px] font-bold text-slate-800 truncate">{p.nombre}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{p.codigo || 'S/N'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* FASE 3: Fixed Footer Dock (KPIs y Gráfico Área Integrado) */}
            <div className="fixed bottom-0 md:left-56 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                {/* 1. KPIs Section */}
                <div className="flex items-center justify-between px-8 py-4 z-20 relative">
                    
                    {/* User Mini Profile in Dock */}
                    <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-100">
                        <span className="w-8 h-8 bg-brand-dark rounded-full text-white flex items-center justify-center text-[10px] font-black shadow-inner">
                            {config?.nombre?.[0] || 'A'}
                        </span>
                        <div>
                            <p className="text-xs font-black text-brand-dark uppercase tracking-wide">{config?.nombre || 'Administración'}</p>
                            <p className="text-[10px] font-bold text-slate-400">Panel Principal</p>
                        </div>
                    </div>

                    {/* Docked KPIs Reactivos */}
                    <div className="flex-1 flex items-center justify-around xl:justify-end gap-2 xl:gap-8 ml-8">
                        {(() => {
                            const kpiMap = {
                                total_productos: <MiniKpi key="1" icon={Package} label="Inventario" value={`${totalProducts}`} sub="Unidades" colorClass="bg-emerald-500" iconColor="text-emerald-600" />,
                                low_stock: <MiniKpi key="2" icon={AlertTriangle} label="Stock Crítico" value={`${lowStockItems.length}`} colorClass="bg-rose-500" iconColor="text-rose-600" />,
                                valor_inventario: <MiniKpi key="3" icon={DollarSign} label="Valorizado" value={formatMoney(totalValue)} colorClass="bg-brand-500" iconColor="text-brand-600" />,
                                total_ventas: <MiniKpi key="4" icon={ShoppingCart} label="Ventas" value={formatMoney(totalSales)} colorClass="bg-indigo-500" iconColor="text-indigo-600" />,
                                total_clientes: <MiniKpi key="5" icon={Users} label="Clientes" value={`${totalClientes}`} colorClass="bg-violet-500" iconColor="text-violet-600" />
                            };
                            let visibleKpis = [];
                            try {
                                if (config?.dash_kpis_visibles) {
                                    visibleKpis = JSON.parse(config.dash_kpis_visibles);
                                }
                            } catch(e) {}
                            
                            if (visibleKpis.length === 0) visibleKpis = ['total_ventas', 'total_productos', 'total_clientes'];
                            return visibleKpis.slice(0,4).map(k => kpiMap[k]);
                        })()}
                    </div>
                </div>

                {/* 2. Full-width Absolute Bottom AreaChart */}
                <div className="absolute bottom-0 left-0 w-full h-16 opacity-30 pointer-events-none z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={topProducts.length >= 2 ? topProducts : [...topProducts, { nombre: 'dummy', total_ventas: 0 }]}>
                            <defs>
                                <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="total_ventas" 
                                stroke="#1e40af" 
                                strokeWidth={2} 
                                fill="url(#glowColor)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

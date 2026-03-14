import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
    Package, AlertTriangle, DollarSign, ShoppingCart,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    FileText, RefreshCw, BarChart2, Zap, Users, History, CheckCircle, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── KPI Card Refresh ────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, colorClass, iconColor }) => (
    <div className="premium-card relative overflow-hidden group">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                <Icon size={20} className={iconColor} />
            </div>
        </div>
        {sub && (
            <div className="mt-4 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${colorClass.replace('bg-', 'bg-')}`}></div>
                <p className="text-[11px] font-medium text-slate-500">{sub}</p>
            </div>
        )}
    </div>
);

// ─── Section Header Refresh ──────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
                <Icon size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 ml-11 font-medium">{subtitle}</p>}
    </div>
);

// ─── Main Dashboard ──────────────────────────────────────────
const Dashboard = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [recentFacturas, setRecentFacturas] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [config, setConfig] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const today = now.toISOString().slice(0, 10);

            const [prodRes, actRes, factRes, topRes, confRes, statsRes] = await Promise.allSettled([
                api.get('/productos'),
                api.get('/movimientos/recientes'),
                api.get('/facturacion'),
                api.get(`/reportes/ventas-producto?fechaInicio=${monthStart}&fechaFin=${today}`),
                api.get('/empresa/configuracion/completa'),
                api.get('/empresa/estadisticas')
            ]);

            if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data);
            if (actRes.status === 'fulfilled') setRecentActivity(actRes.value.data.slice(0, 8));
            if (factRes.status === 'fulfilled') setRecentFacturas(factRes.value.data.slice(0, 6));
            if (topRes.status === 'fulfilled') {
                setTopProducts(topRes.value.data.sort((a, b) => b.total_ventas - a.total_ventas).slice(0, 5));
            }
            if (confRes.status === 'fulfilled') {
                setConfig(confRes.value.data);
                localStorage.setItem('dash_kpis', confRes.value.data.dash_kpis_visibles || '[]');
            }
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (e) {
            console.error('Dashboard fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAll();
        
        const handleStorage = () => {
            const kpis = localStorage.getItem('dash_kpis');
            if (kpis) {
                // Forzar re-render cargando de nuevo los datos o actualizando estado local
                fetchAll(); 
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [token]);

    const totalProducts = stats?.total_productos ?? (Array.isArray(products) ? products.length : 0);
    const lowStockItems = Array.isArray(products) ? products.filter(p => p.stock <= 5 && p.stock >= 0) : [];
    const criticalItems = stats?.productos_sin_stock ?? (Array.isArray(products) ? products.filter(p => p.stock === 0).length : 0);
    const totalValue = stats?.valor_inventario ?? (Array.isArray(products) ? products.reduce((s, p) => s + (p.precio || 0) * (p.stock || 0), 0) : 0);
    const totalFacturasSales = stats?.ventas_totales ?? (Array.isArray(recentFacturas) ? recentFacturas.reduce((s, f) => s + Number(f.total || 0), 0) : 0);
    const totalPagosSales = stats?.monto_pagos ?? 0;
    const totalSales = totalFacturasSales + totalPagosSales;
    const totalClientes = stats?.total_clientes ?? 0;
    const totalMovimientos = stats?.total_movimientos ?? (Array.isArray(recentActivity) ? recentActivity.length : 0);

    const BAR_COLORS = ['#3b82f6', '#475569', '#6366f1', '#8b5cf6', '#cbd5e1'];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Panel de Gestión</h1>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                        {lastUpdated ? `Última sincronización: ${lastUpdated}` : 'Consultando almacén...'}
                    </p>
                </div>
                <button
                    onClick={fetchAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition shadow-soft disabled:opacity-60 active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refrescar Datos
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(() => {
                    const visibleKpis = (() => {
                        try {
                            const stored = localStorage.getItem('dash_kpis');
                            if (!stored) return ["total_productos", "stock_bajo", "valor_inventario", "ventas_mes", "pagos_externos"];
                            let parsed = JSON.parse(stored);
                            // Migración automática: asegurar que pagos_externos aparezca si es una instalación activa
                            if (Array.isArray(parsed) && !parsed.includes('pagos_externos')) {
                                parsed.push('pagos_externos');
                                localStorage.setItem('dash_kpis', JSON.stringify(parsed));
                            }
                            return parsed;
                        } catch { return ["total_productos", "stock_bajo", "pagos_externos"]; }
                    })();

                    const kpiMap = {
                        total_productos: (
                            <KpiCard
                                key="tp"
                                icon={Package}
                                label="Total Catálogo"
                                value={totalProducts}
                                sub={`${stats?.productos_sin_stock || 0} productos agotados`}
                                colorClass="bg-primary-100"
                                iconColor="text-primary-600"
                            />
                        ),
                        stock_bajo: (
                            <KpiCard
                                key="sb"
                                icon={AlertTriangle}
                                label="Alertas de Stock"
                                value={lowStockItems.length}
                                sub={lowStockItems.length > 0 ? `${lowStockItems.length} requieren reposición` : 'Inventario saludable'}
                                colorClass={lowStockItems.length > 0 ? "bg-amber-100" : "bg-emerald-100"}
                                iconColor={lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"}
                            />
                        ),
                        valor_inventario: (
                            <KpiCard
                                key="vi"
                                icon={DollarSign}
                                label="Valor Almacén"
                                value={`${config?.simbolo_moneda || '$'}${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
                                sub="Estimación de capital activo"
                                colorClass="bg-emerald-100"
                                iconColor="text-emerald-600"
                            />
                        ),
                        ventas_mes: (
                            <KpiCard
                                key="vm"
                                icon={ShoppingCart}
                                label="Ingresos de Mes"
                                value={`${config?.simbolo_moneda || '$'}${totalSales.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
                                sub={`${recentFacturas.length} ventas procesadas`}
                                colorClass="bg-violet-100"
                                iconColor="text-violet-600"
                            />
                        ),
                        clientes_nuevos: (
                            <KpiCard
                                key="cn"
                                icon={Users}
                                label="Base de Clientes"
                                value={totalClientes}
                                sub="Clientes registrados"
                                colorClass="bg-blue-100"
                                iconColor="text-blue-600"
                            />
                        ),
                        movimientos: (
                            <KpiCard
                                key="mov"
                                icon={History}
                                label="Flujo de Stock"
                                value={totalMovimientos}
                                sub="Operaciones recientes"
                                colorClass="bg-slate-100"
                                iconColor="text-slate-600"
                            />
                        ),
                        pagos_externos: (
                            <KpiCard
                                key="pext"
                                icon={Zap}
                                label="Pagos Externos"
                                value={stats?.pagos_aprobados || 0}
                                sub={`${config?.simbolo_moneda || '$'}${totalPagosSales.toLocaleString('es-AR')} aprobados`}
                                colorClass="bg-amber-100"
                                iconColor="text-amber-600"
                            />
                        )
                    };

                    return visibleKpis.map(id => kpiMap[id]);
                })()}
            </div>

            {/* Middle Row: Bento Grid Style */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Product Chart */}
                <div className="lg:col-span-8 premium-card">
                    <SectionHeader
                        icon={BarChart2}
                        title="Rendimiento de Ventas"
                        subtitle="Top 5 productos con mayor rotación este mes."
                    />
                    {topProducts.length > 0 ? (
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} barCategoryGap="40%">
                                    <XAxis
                                        dataKey="nombre"
                                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        tickFormatter={v => v.length > 15 ? v.slice(0, 15) + '…' : v}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontSize: '11px', padding: '12px' }}
                                        itemStyle={{ fontWeight: '800' }}
                                    />
                                    <Bar dataKey="total_ventas" radius={[10, 10, 10, 10]}>
                                        {topProducts.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-slate-200 border-2 border-dashed border-slate-50 rounded-2xl">
                            <TrendingUp size={48} strokeWidth={1} />
                            <p className="text-xs mt-4 font-bold text-slate-400">Sin datos comerciales registrados</p>
                        </div>
                    )}
                </div>

                {/* Stock Critico Panel */}
                <div className="lg:col-span-4 premium-card flex flex-col">
                    <SectionHeader
                        icon={Zap}
                        title="Reposición Inmediata"
                        subtitle="Prioridad alta por reserva insuficiente."
                    />
                    {lowStockItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-200 py-10">
                            <CheckCircle size={56} strokeWidth={1} className="text-emerald-400 mb-4 opacity-40" />
                            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Stock Asegurado</p>
                        </div>
                    ) : (
                        <div className="space-y-2 overflow-y-auto pr-1 max-h-[300px] custom-scrollbar">
                            {lowStockItems.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black ${p.stock === 0 ? 'bg-rose-500' : 'bg-primary-500'}`}>
                                        {p.stock}
                                    </div>
                                    <div className="min-w-0 mr-2 flex-1">
                                        <p className="text-xs font-bold text-slate-800 truncate">{p.nombre}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{p.categoria || 'Sin categoría'}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Minimalist Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Recent Feed */}
                <div className="premium-card">
                    <SectionHeader icon={History} title="Actividad Reciente" subtitle="Trazabilidad de entradas y salidas." />
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-xs text-slate-300 font-bold py-10 text-center">Histororial vacío</p>
                        ) : (
                            recentActivity.map((mov, i) => {
                                const isEntrada = mov.tipo?.toLowerCase() === 'entrada';
                                return (
                                    <div key={mov.id || i} className="flex items-center gap-4 group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEntrada ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {isEntrada ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-extrabold text-slate-800 truncate uppercase tracking-tight">{mov.producto}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Hace un momento · Almacén Central</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black ${isEntrada ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isEntrada ? '+' : '-'}{mov.cantidad}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Sales Feed */}
                <div className="premium-card">
                    <SectionHeader icon={FileText} title="Flujo de Caja" subtitle="Resumen de las últimas transacciones." />
                    <div className="overflow-hidden bg-slate-50 border border-slate-100 rounded-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100 font-extrabold text-[9px] uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Referencia</th>
                                    <th className="px-5 py-3">Cliente</th>
                                    <th className="px-5 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentFacturas.map(f => (
                                    <tr key={f.id} className="hover:bg-white transition-colors cursor-pointer group">
                                        <td className="px-5 py-3.5 font-black text-[11px] text-primary-600 font-mono tracking-tighter">#{f.nro_factura}</td>
                                        <td className="px-5 py-3.5 text-xs font-bold text-slate-700 truncate max-w-[150px]">{f.cliente_nombre}</td>
                                        <td className="px-5 py-3.5 text-right font-black text-xs text-slate-900">{config?.simbolo_moneda || '$'}{Number(f.total).toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Dashboard;

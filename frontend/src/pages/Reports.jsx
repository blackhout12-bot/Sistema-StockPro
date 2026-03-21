import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import {
    TrendingUp, AlertCircle, Package, Building2, Filter,
    DollarSign, ShoppingCart, BarChart2, Download
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ── KPI Card compact ─────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color = 'indigo' }) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
            </div>
            <div className={`p-2.5 rounded-xl bg-${color}-50`}>
                <Icon size={18} className={`text-${color}-600`} />
            </div>
        </div>
    </div>
);

const Reports = () => {
    const { token } = useAuth();
    const { sucursalActiva, sucursales } = useBranch();

    const [stockData, setStockData] = useState([]);
    const [movementsData, setMovementsData] = useState([]);
    const [ventasData, setVentasData] = useState([]);
    const [branchData, setBranchData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [startDate, setStartDate] = useState(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterSucursal, setFilterSucursal] = useState(''); // '' = todas

    useEffect(() => {
        if (token) fetchReportsData();
    }, [token, startDate, endDate, filterSucursal]);

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                fechaInicio: startDate,
                fechaFin: endDate,
                ...(filterSucursal ? { sucursal_id: filterSucursal } : {})
            });

            const [prodRes, movsRes, ventasRes] = await Promise.allSettled([
                api.get('/productos'),
                api.get(`/reportes/movimientos?${params}`),
                api.get(`/facturacion?${params}`)
            ]);

            // Stock
            if (prodRes.status === 'fulfilled') {
                setStockData(prodRes.value.data.map(p => ({
                    name: p.nombre.length > 14 ? p.nombre.slice(0, 14) + '…' : p.nombre,
                    fullName: p.nombre,
                    stock: p.stock,
                    valor: p.stock * p.precio
                })));
            }

            // Movimientos agrupados por día
            if (movsRes.status === 'fulfilled') {
                const agg = {};
                movsRes.value.data.forEach(m => {
                    const d = new Date(m.fecha).toISOString().split('T')[0];
                    if (!agg[d]) agg[d] = { date: d, entradas: 0, salidas: 0 };
                    if (m.tipo === 'entrada') agg[d].entradas += m.cantidad;
                    if (m.tipo === 'salida') agg[d].salidas += m.cantidad;
                });
                setMovementsData(Object.values(agg).sort((a, b) => new Date(a.date) - new Date(b.date)));
            }

            // Ventas por día + por sucursal
            if (ventasRes.status === 'fulfilled') {
                const facturas = ventasRes.value.data || [];
                const ventasPorDia = {};
                const ventasPorSucursal = {};

                facturas.forEach(f => {
                    const d = new Date(f.fecha_emision).toISOString().split('T')[0];
                    if (!ventasPorDia[d]) ventasPorDia[d] = { date: d, total: 0, cantidad: 0 };
                    ventasPorDia[d].total += Number(f.total || 0);
                    ventasPorDia[d].cantidad += 1;

                    const suc = f.sucursal_nombre || f.sucursal_id || 'Principal';
                    if (!ventasPorSucursal[suc]) ventasPorSucursal[suc] = { sucursal: suc, total: 0, cantidad: 0 };
                    ventasPorSucursal[suc].total += Number(f.total || 0);
                    ventasPorSucursal[suc].cantidad += 1;
                });

                setVentasData(Object.values(ventasPorDia).sort((a, b) => new Date(a.date) - new Date(b.date)));
                setBranchData(Object.values(ventasPorSucursal).sort((a, b) => b.total - a.total));
            }

        } catch (err) {
            console.error('Error al cargar reportes:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalInventoryValue = useMemo(() => stockData.reduce((acc, curr) => acc + curr.valor, 0), [stockData]);
    const lowStockCount = useMemo(() => stockData.filter(p => p.stock < 10).length, [stockData]);
    const totalVentas = useMemo(() => ventasData.reduce((s, d) => s + d.total, 0), [ventasData]);
    const totalFacturas = useMemo(() => ventasData.reduce((s, d) => s + d.cantidad, 0), [ventasData]);

    return (
        <div className="space-y-6">
            {/* Header + Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Reportes & Analítica</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {filterSucursal
                            ? `Sucursal: ${sucursales.find(s => String(s.id) === filterSucursal)?.nombre || filterSucursal}`
                            : 'Todas las sucursales consolidadas'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filtro Sucursal */}
                    {sucursales.length > 1 && (
                        <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl px-3 py-2">
                            <Building2 size={13} className="text-slate-400" />
                            <select
                                value={filterSucursal}
                                onChange={e => setFilterSucursal(e.target.value)}
                                className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                            >
                                <option value="">Todas las sucursales</option>
                                {sucursales.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filtro Fecha */}
                    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2">
                        <Filter size={13} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="text-xs font-semibold text-slate-700 outline-none border-none bg-transparent"
                        />
                        <span className="text-slate-300">→</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="text-xs font-semibold text-slate-700 outline-none border-none bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-100 border-t-primary-600" />
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard icon={Package} label="Productos" value={stockData.length} color="indigo" />
                        <KpiCard icon={AlertCircle} label="Stock Crítico" value={lowStockCount} color="red" />
                        <KpiCard icon={DollarSign} label="Valor Inventario" value={`$${(totalInventoryValue / 1000).toFixed(0)}k`} color="emerald" />
                        <KpiCard icon={ShoppingCart} label={`Ventas (${totalFacturas})`} value={`$${(totalVentas / 1000).toFixed(0)}k`} color="violet" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Ventas por Día */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Ventas Diarias</h3>
                            <div className="h-64">
                                {ventasData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={ventasData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                                            <Area type="monotone" dataKey="total" name="Total $" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
                                            <Bar dataKey="cantidad" name="Facturas" fill="#10b981" radius={[3, 3, 0, 0]} yAxisId={0} opacity={0.6} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                        Sin ventas en este rango
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Movimientos */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Flujo de Movimientos</h3>
                            <div className="h-64">
                                {movementsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={movementsData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <Tooltip />
                                            <Legend iconSize={10} />
                                            <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="salidas" name="Salidas" stroke="#ef4444" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                        Sin movimientos en este rango
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comparativo por Sucursal */}
                        {branchData.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-5">
                                <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">
                                    Ventas por Sucursal
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={branchData} margin={{ top: 5, right: 5, bottom: 15, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="sucursal" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                                            <Bar dataKey="total" name="Total $" radius={[6, 6, 0, 0]}>
                                                {branchData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Top Stock Disponible */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Stock (Top 10)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={stockData.sort((a, b) => b.stock - a.stock).slice(0, 10)}
                                        layout="vertical"
                                        margin={{ top: 0, right: 10, bottom: 0, left: 50 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={50} />
                                        <Tooltip formatter={(v, _, props) => [v, props.payload.fullName]} />
                                        <Bar dataKey="stock" name="Stock" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribución de valor (Pie) */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 lg:col-span-2">
                            <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Distribución Valor en Inventario</h3>
                            <div className="h-72 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stockData.filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 12)}
                                            cx="50%" cy="50%"
                                            innerRadius={70} outerRadius={110}
                                            paddingAngle={2}
                                            dataKey="valor"
                                            nameKey="name"
                                            label={({ name, percent }) => percent > 0.04 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                                        >
                                            {stockData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                                        <Legend iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;

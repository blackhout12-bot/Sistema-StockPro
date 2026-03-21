import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import {
    Package, AlertTriangle, DollarSign, ShoppingCart, Users, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import RubroShowcaseCard from '../components/RubroShowcaseCard';

// ─── Componentes Auxiliares ────────────────────────────────────────
const MiniKpi = ({ icon: Icon, label, value, sub, colorClass, iconColor }) => (
    <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/50 shadow-sm ml-4">
        <div className={`p-3.5 rounded-2xl ${colorClass} bg-opacity-15`}>
            <Icon size={26} className={iconColor} strokeWidth={2.5} />
        </div>
        <div>
            <p className="text-[10.5px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
            <p className="text-[22px] font-black text-slate-800 tracking-tight leading-none mt-1">{value}</p>
            {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

// ─── Main Dashboard ──────────────────────────────────────────
const Dashboard = () => {
    const { token } = useAuth();
    const { sucursalActiva, sucursales } = useBranch();
    
    const { data: dashData, isLoading: loading, refetch: fetchAll } = useQuery({
        queryKey: ['dashboard', 'main-stats'],
        enabled: !!token,
        staleTime: 5 * 60 * 1000, 
        queryFn: async () => {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const today = now.toISOString().slice(0, 10);

            const [prodRes, factRes, topRes, confRes, statsRes] = await Promise.allSettled([
                api.get('/productos'),
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

            // Mapea todos los productos o usa los del topRes
            const productosCat = prodRes.status === 'fulfilled' ? prodRes.value.data : [];
            const topProductsIds = topRes.status === 'fulfilled' ? topRes.value.data.sort((a, b) => b.total_ventas - a.total_ventas).map(p => p.id) : [];
            
            // Reordenamos catálogo para q top items aparezcan primero pero mantengamos todos para la grilla
            const sortedGrid = [...productosCat].sort((a,b) => {
                const iA = topProductsIds.indexOf(a.id);
                const iB = topProductsIds.indexOf(b.id);
                if(iA > -1 && iB > -1) return iA - iB;
                if(iA > -1) return -1;
                if(iB > -1) return 1;
                return new Date(b.creado_en) - new Date(a.creado_en);
            });

            return {
                products: productosCat,
                gridDisplay: sortedGrid,
                recentFacturas: factRes.status === 'fulfilled' ? factRes.value.data.slice(0, 6) : [],
                trendData: topRes.status === 'fulfilled' ? topRes.value.data : [],
                config: configPayload,
                stats: statsRes.status === 'fulfilled' ? statsRes.value.data : null,
                lastUpdated: new Date().toLocaleTimeString()
            };
        }
    });

    const { products = [], gridDisplay = [], trendData = [], config = null, stats = null, lastUpdated = null } = dashData || {};

    const totalProducts = stats?.total_productos ?? products.length;
    const lowStockItems = products.filter(p => p.stock <= 5 && p.stock >= 0);
    const totalValue = stats?.valor_inventario ?? products.reduce((s, p) => s + (p.precio || 0) * (p.stock || 0), 0);
    const totalFacturasSales = dashData?.recentFacturas ? dashData.recentFacturas.reduce((s, f) => s + Number(f.total || 0), 0) : 0;
    const totalPagosSales = stats?.monto_pagos ?? 0;
    const totalSales = totalFacturasSales + totalPagosSales;
    const totalClientes = stats?.total_clientes ?? 0;

    const formatMoney = (val) => `${config?.simbolo_moneda || '$'}${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

    return (
        <div className="h-full relative overflow-x-hidden min-h-screen">
            {/* Scrollable Content Area. Pad bottom to make space for the fixed KPI dock */}
            <div className="pb-56 animate-in fade-in duration-700 mx-auto px-4 lg:px-8 max-w-[1600px] mt-6">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-brand-dark tracking-tighter drop-shadow-sm">Panel de Control</h1>
                        <p className="text-[13px] text-slate-500 mt-1 font-bold tracking-wide">
                            {lastUpdated ? `Última sincronización: ${lastUpdated}` : 'Consultando inventarios...'}
                        </p>
                    </div>
                    <button
                        onClick={fetchAll} disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-brand-dark text-[11px] border border-slate-200 font-extrabold tracking-[0.1em] uppercase rounded-full hover:bg-slate-50 transition shadow-sm disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-brand-500' : 'text-slate-400'} strokeWidth={3} />
                        Actualizar
                    </button>
                </div>

                {/* Grilla Pura de Productos (GestiónMax Format) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-7">
                    {gridDisplay.length > 0 ? (
                        gridDisplay.slice(0, 15).map(prod => (
                            <RubroShowcaseCard 
                                key={prod.id} 
                                producto={prod} 
                                rubro={config?.rubro || 'general'} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full h-48 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">
                            <p className="text-sm font-bold text-slate-400">Sin inventario para exhibición</p>
                        </div>
                    )}
                </div>

            </div>

            {/* FASE 3/4: Fixed Footer Dock Integrado (KPIs Up, ÁreaChart Down, Left-Aligned User) */}
            <div className="fixed bottom-0 left-0 md:left-56 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200 z-40 pb-0 overflow-hidden shadow-[0_-15px_60px_-15px_rgba(0,0,0,0.1)]">
                
                {/* Nivel 1: KPIs Section + MiniProfile */}
                <div className="flex items-center justify-between px-8 py-5 relative z-20">
                    
                    {/* User Mini Profile */}
                    <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-6 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-full text-white flex items-center justify-center text-xs font-black shadow-inner">
                            {config?.nombre?.[0] || 'A'}
                        </span>
                        <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{config?.nombre || 'Administración'}</p>
                            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                Sesión Activa
                            </p>
                        </div>
                    </div>

                    {/* Docked KPIs Reactivos */}
                    <div className="flex-1 flex items-center xl:justify-end overflow-x-auto custom-scrollbar pr-4">
                        {(() => {
                            const kpiMap = {
                                total_productos: <MiniKpi key="1" icon={Package} label="Inventario" value={`${totalProducts}`} sub="Unidades" colorClass="bg-emerald-500" iconColor="text-emerald-600" />,
                                low_stock: <MiniKpi key="2" icon={AlertTriangle} label="Stock Crítico" value={`${lowStockItems.length}`} colorClass="bg-rose-500" iconColor="text-rose-600" />,
                                valor_inventario: <MiniKpi key="3" icon={DollarSign} label="Valorizado" value={formatMoney(totalValue)} colorClass="bg-brand-500" iconColor="text-brand-600" />,
                                total_ventas: <MiniKpi key="4" icon={ShoppingCart} label="Ventas Hoy" value={formatMoney(totalSales)} colorClass="bg-indigo-500" iconColor="text-indigo-600" />,
                                total_clientes: <MiniKpi key="5" icon={Users} label="Clientes" value={`${totalClientes}`} colorClass="bg-violet-500" iconColor="text-violet-600" />
                            };
                            let visibleKpis = ['total_ventas', 'total_productos', 'total_clientes'];
                            try {
                                if (config?.dash_kpis_visibles) {
                                    const parsed = JSON.parse(config.dash_kpis_visibles);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                        visibleKpis = parsed;
                                    }
                                }
                            } catch(e) {}
                            return visibleKpis.slice(0,4).map(k => kpiMap[k]);
                        })()}
                    </div>
                </div>

                {/* Nivel 2: Gráfico Área 100% Ancho ocupando la base solidamente */}
                <div className="w-full h-24 relative z-10 -mt-2 opacity-80 mix-blend-multiply">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData.length >= 2 ? trendData : [...trendData, { nombre: 'dummy', total_ventas: 0 }, { nombre: 'dummy2', total_ventas: 0 }]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="total_ventas" 
                                stroke="#2563eb" 
                                strokeWidth={3} 
                                fill="url(#glowColor)" 
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

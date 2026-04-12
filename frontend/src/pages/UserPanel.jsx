import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, User as UserIcon } from 'lucide-react';
import RubroShowcaseCard from '../components/RubroShowcaseCard';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/axiosConfig';

const UserPanel = () => {
    const { user, token, config } = useAuth();
    
    // Obtenemos solo el grid display (productos disponibles) sin KPIs financieros.
    const { data: dashData, isLoading } = useQuery({
        queryKey: ['dashboard', 'user-panel'],
        enabled: !!token,
        queryFn: async () => {
            const prodRes = await api.get('/productos').catch(() => ({ data: [] }));
            const productosCat = prodRes.data || [];
            
            // Ordenar productos más recientes (sin datos de ventas que requieran permisos)
            const sortedGrid = [...productosCat].sort((a,b) => {
                const dateB = new Date(b.actualizado_en || b.creado_en).getTime() || 0;
                const dateA = new Date(a.actualizado_en || a.creado_en).getTime() || 0;
                return dateB - dateA;
            });

            return {
                gridDisplay: sortedGrid
            };
        }
    });

    const { gridDisplay = [] } = dashData || {};

    return (
        <div className="h-full relative overflow-x-hidden min-h-screen">
            <div className="pb-32 animate-in fade-in duration-700 mx-auto px-4 lg:px-8 max-w-[1600px] mt-6">
                
                {/* Header Profile */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-brand-dark tracking-tighter drop-shadow-sm">¡Hola, {user?.nombre?.split(' ')[0]}!</h1>
                        <p className="text-[13px] text-slate-500 mt-1 font-bold tracking-wide">
                            Este es tu espacio de trabajo.
                        </p>
                    </div>
                </div>

                {/* Banner Simple */}
                <div className="mb-10 p-6 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl shadow-xl flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="relative z-10 text-white">
                        <h2 className="text-2xl font-black mb-1">Acceso Rápido</h2>
                        <p className="text-brand-100 font-medium text-sm">Navega por las secciones usando el menú de la izquierda según tu nivel de acceso asignado ({window.String(user?.rol).toUpperCase()}).</p>
                    </div>
                    <div className="hidden sm:flex relative z-10 p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                        <UserIcon size={32} className="text-white" />
                    </div>
                </div>

                {/* Grilla Pura de Productos (Solo Lectura Simplificada) */}
                <div className="mb-6 flex items-center gap-2">
                    <Package className="text-brand-500" size={20} />
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Catálogo Reciente</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-7">
                    {gridDisplay.length > 0 ? (
                        gridDisplay.slice(0, 10).map(prod => (
                            <RubroShowcaseCard 
                                key={prod.id || Math.random().toString(36).substring(7)} 
                                producto={prod} 
                                rubro={'general'} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">
                            {isLoading ? (
                                <p className="text-sm font-bold text-slate-400">Cargando...</p>
                            ) : (
                                <p className="text-sm font-bold text-slate-400">Sin inventario visible</p>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default UserPanel;

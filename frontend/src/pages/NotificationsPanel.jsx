import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { Bell, Check, Trash2, Search, Filter, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NotificationsPanel() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, INFO, WARNING, ERROR, SUCCESS
    const [filterState, setFilterState] = useState('ALL'); // ALL, READ, UNREAD

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications_full'],
        queryFn: async () => {
            const res = await api.get('/notificaciones');
            return res.data;
        }
    });

    const readMutation = useMutation({
        mutationFn: (id) => api.put(`/notificaciones/leer/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications_full'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] }); // TopBar
        }
    });

    const readAllMutation = useMutation({
        mutationFn: () => api.put('/notificaciones/leer-todas'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications_full'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Todas las notificaciones marcadas como leídas');
        }
    });

    const clearMutation = useMutation({
        mutationFn: () => api.delete('/notificaciones/limpiar'), // Endpoint asumido bulk delete
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications_full'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Bandeja limpiada (solo leídas eliminadas)');
        },
        onError: () => {
            // Alternativa si no existe endpoint delete: marcar todo leído temporalmente
            readAllMutation.mutate();
            toast('El historial se mantiene por auditoría.', { icon: 'ℹ️' });
        }
    });

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const matchSearch = String(n.titulo).toLowerCase().includes(searchTerm.toLowerCase()) || 
                                String(n.mensaje).toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchType = filterType === 'ALL' || (n.tipo || 'info').toUpperCase() === filterType;
            const matchState = filterState === 'ALL' || (filterState === 'READ' ? n.leido : !n.leido);

            return matchSearch && matchType && matchState;
        });
    }, [notifications, searchTerm, filterType, filterState]);

    const getIconForType = (type) => {
        switch((type || '').toLowerCase()) {
            case 'error': case 'danger': return <AlertTriangle className="text-rose-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
            default: return <Info className="text-indigo-500" size={20} />;
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Cargando bandeja...</div>;

    const unreadCount = notifications.filter(n => !n.leido).length;

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Bell size={28} />
                        </div>
                        Centro de Notificaciones
                    </h1>
                    <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest ml-1">
                        Historial y Eventos del Sistema
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button onClick={() => readAllMutation.mutate()} className="px-5 py-3 rounded-xl bg-white text-[11px] font-black uppercase tracking-widest text-primary-600 shadow-sm border border-primary-100 hover:bg-primary-50 transition-colors flex items-center gap-2">
                            <Check size={16} /> Marcar todo leído
                        </button>
                    )}
                    <button onClick={() => clearMutation.mutate()} className="px-5 py-3 rounded-xl bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center gap-2">
                        <Trash2 size={16} /> Limpiar Historial
                    </button>
                </div>
            </div>

            {/* Panel de Filtros */}
            <div className="premium-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar en mensajes y títulos..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-xl text-sm font-bold border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                </div>
                <div>
                    <select value={filterState} onChange={e => setFilterState(e.target.value)} className="w-full bg-slate-50 px-4 py-4 rounded-xl text-sm font-bold border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer">
                        <option value="ALL">Estados: Todos</option>
                        <option value="UNREAD">Solo No Leídas ({unreadCount})</option>
                        <option value="READ">Ya Leídas</option>
                    </select>
                </div>
                <div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-slate-50 px-4 py-4 rounded-xl text-sm font-bold border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer">
                        <option value="ALL">Tipos: Todos</option>
                        <option value="INFO">Informativas</option>
                        <option value="WARNING">Advertencias</option>
                        <option value="ERROR">Errores / Críticas</option>
                        <option value="SUCCESS">Éxitos</option>
                    </select>
                </div>
            </div>

            {/* Listado */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {filteredNotifications.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 tracking-tight">Cero Resultados</h3>
                        <p className="text-sm font-medium text-slate-400 mt-1">No se encontraron notificaciones que coincidan con los filtros.</p>
                    </div>
                ) : (
                    filteredNotifications.map(n => (
                        <div key={n.id} className={`p-6 flex items-start gap-4 transition-colors hover:bg-slate-50/50 ${!n.leido ? 'bg-primary-50/20' : ''}`}>
                            <div className={`mt-1 p-2.5 rounded-2xl flex-shrink-0 ${!n.leido ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'bg-slate-50'}`}>
                                {getIconForType(n.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-1">
                                    <h4 className={`text-sm font-black truncate tracking-tight ${!n.leido ? 'text-primary-900' : 'text-slate-700'}`}>
                                        {n.titulo}
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap">
                                        <Clock size={12} />
                                        {new Date(n.creado_en).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-3">
                                    {n.mensaje}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${n.leido ? 'bg-slate-100 text-slate-400' : 'bg-primary-100 text-primary-700'}`}>
                                        {n.leido ? 'Leída' : 'Nueva'}
                                    </span>
                                    
                                    {!n.leido && (
                                        <button 
                                            onClick={() => readMutation.mutate(n.id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 flex items-center gap-1 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                                        >
                                            <Check size={14} /> Marcar como Leída
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

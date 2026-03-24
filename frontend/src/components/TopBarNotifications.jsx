import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';

const TopBarNotifications = () => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { token, user, empresaConfig } = useAuth();
    
    // El tenant activo viene del token decodificado internamente en el context, 
    // pero usualmente es user.empresa_id 
    const tenantId = user?.empresa_id;

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notificaciones');
            return res.data;
        },
        enabled: !!token
    });

    useEffect(() => {
        if (!token || !tenantId) return;

        // Conectar al namespace de Socket.io
        const socket = io(`${import.meta.env.VITE_API_URL}/tenant-${tenantId}`, {
            transports: ['websocket', 'polling'], // Fallback
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('🔗 WebSocket conectado al Tenant:', tenantId);
            // El usuario podría emitir "join-room" si tuviera sub-salas
        });

        socket.on('nueva-notificacion', (newNotification) => {
            // Filtrar si la notificación no es general y no pertenece a mí
            if (newNotification.usuario_id && newNotification.usuario_id !== user.id) {
                return;
            }

            // Actualizar caché de TanStack Query
            queryClient.setQueryData(['notifications'], (old = []) => {
                return [newNotification, ...old];
            });

            // Sonido y Toast
            const isError = newNotification.tipo === 'error' || newNotification.tipo === 'danger';
            const iconType = isError ? '🚨' : (newNotification.tipo === 'warning' ? '⚠️' : '🔔');
            
            toast(`${newNotification.titulo}\n${newNotification.mensaje}`, {
                icon: iconType,
                duration: 5000,
                position: 'top-right',
                style: {
                    borderRadius: '1rem',
                    background: '#fff',
                    color: '#334155',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    fontWeight: 900,
                    fontSize: '13px'
                },
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [token, tenantId, user, queryClient]);

    const unreadCount = notifications.filter(n => !n.leido).length;

    const readMutation = useMutation({
        mutationFn: (id) => api.put(`/notificaciones/leer/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    const readAllMutation = useMutation({
        mutationFn: () => api.put('/notificaciones/leer-todas'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    const handleClickOutside = () => setIsOpen(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-95 shadow-sm"
                aria-label="Ver notificaciones"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow ring-2 ring-primary-900 animate-in zoom-in duration-300">
                        {unreadCount > 99 ? '+99' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 transition-opacity" onClick={handleClickOutside}></div>
                    <div className="absolute right-0 mt-3 w-80 lg:w-96 z-50 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between border-b border-slate-50 bg-surface-50 p-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Notificaciones Pivot</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => readAllMutation.mutate()}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm"
                                >
                                    Marcar todo leído
                                </button>
                            )}
                        </div>
                        <div className="max-h-[22rem] overflow-y-auto overscroll-contain">
                            {notifications.length === 0 ? (
                                <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
                                    <Bell size={32} className="text-slate-200 mb-3" />
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        Bandeja de Entrada Vacía
                                    </span>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`group relative flex flex-col border-b border-slate-50 p-5 transition-all hover:bg-slate-50 ${!n.leido ? 'bg-indigo-50/40' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className={`text-[13px] font-black leading-tight ${!n.leido ? 'text-primary-900' : 'text-slate-700'}`}>
                                                {n.titulo}
                                            </span>
                                            {!n.leido && (
                                                <button
                                                    onClick={() => readMutation.mutate(n.id)}
                                                    className="rounded-full bg-white p-1.5 text-slate-300 shadow-sm border border-slate-100 hover:text-emerald-500 hover:border-emerald-200 transition-all active:scale-90 flex-shrink-0"
                                                    title="Marcar como leída"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-2 text-[12px] font-medium text-slate-500 leading-relaxed pr-6">
                                            {n.mensaje}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {n.tipo || 'INFO'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {new Date(n.creado_en).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(n.creado_en).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="border-t border-slate-50 bg-slate-50 p-2 text-center">
                            <button
                                onClick={() => { setIsOpen(false); navigate('/notificaciones'); }}
                                className="text-[11px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 transition-colors w-full py-2"
                            >
                                Ver Todas las Notificaciones →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TopBarNotifications;

import React, { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';

const NotificationsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notificaciones');
            return res.data;
        },
        refetchInterval: 60000 // Refresh every minute
    });

    const unreadCount = notifications.filter(n => !n.leido).length;

    const readMutation = useMutation({
        mutationFn: (id) => api.put(`/notificaciones/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries(['notifications'])
    });

    const readAllMutation = useMutation({
        mutationFn: () => api.put('/notificaciones/read-all'),
        onSuccess: () => queryClient.invalidateQueries(['notifications'])
    });

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 z-50 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                            <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => readAllMutation.mutate()}
                                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800"
                                >
                                    Marcar todo leído
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-10 text-center text-sm text-gray-400">
                                    No hay notificaciones
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`group relative flex flex-col border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${!n.leido ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`text-sm font-bold ${!n.leido ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                {n.titulo}
                                            </span>
                                            {!n.leido && (
                                                <button
                                                    onClick={() => readMutation.mutate(n.id)}
                                                    className="rounded-full p-1 text-gray-300 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-3">
                                            {n.mensaje}
                                        </p>
                                        <span className="mt-2 text-[10px] text-gray-400">
                                            {new Date(n.creado_en).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationsDropdown;

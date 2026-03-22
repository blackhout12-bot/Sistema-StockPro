import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { token, usuario } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!token || !usuario?.empresa_id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Determinar URL base (asumiendo VITE_API_URL termina en /api/v1)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        let wsUrl = apiUrl;
        if (wsUrl.endsWith('/api/v1')) {
            wsUrl = wsUrl.replace('/api/v1', '');
        }

        const newSocket = io(`${wsUrl}/tenant-${usuario.empresa_id}`, {
            auth: { token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('[Socket.io] Conectado exitosamente al Tenant', usuario.empresa_id);
        });

        // Evento de Notificación de Stock
        newSocket.on('notification:stock_bajo', (data) => {
            toast(
                (t) => (
                    <div className="flex items-start gap-4">
                        <div className="text-rose-500 text-xl flex-shrink-0 animate-pulse">⚠️</div>
                        <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{data.title}</p>
                            <p className="text-xs font-semibold text-slate-600 mt-1 leading-snug">{data.message}</p>
                        </div>
                    </div>
                ),
                { duration: 8000, position: 'top-right', style: { border: '1px solid #fecdd3', background: '#fff1f2', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' } }
            );
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, usuario]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};

import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

const PaymentsDashboard = () => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
    const [syncStatus, setSyncStatus] = useState('connecting');
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        fetchPayments();
        setupWebSocket();
    }, []);

    const fetchPayments = async () => {
        try {
            // Asumimos que hay un endpoint para listar pagos
            const res = await api.get('/payments/recent');
            setPayments(res.data.payments || []);
            setStats(res.data.stats || { approved: 0, pending: 0, rejected: 0 });
        } catch (err) {
            console.error('Error fetching payments:', err);
        }
    };

    const setupWebSocket = () => {
        const tenantId = 1; // Debería venir del contexto de usuario
        const socket = io(`http://127.0.0.1:5000/tenant-${tenantId}`);

        socket.on('connect', () => {
            setSyncStatus('online');
            toast.success('Sincronización en tiempo real activa');
        });

        socket.on('stock-update', (data) => {
            setLastSync(new Date());
            // Opcional: refrescar algo si es relevante aquí
        });

        socket.on('disconnect', () => setSyncStatus('offline'));

        return () => socket.disconnect();
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800">Panel de Integraciones Externas</h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Pagos Aprobados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Pendientes</p>
                    <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Rechazados</p>
                    <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Status WebSocket</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${syncStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <p className="text-lg font-semibold uppercase">{syncStatus}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">Transacciones Recientes</h2>
                        <button onClick={fetchPayments} className="text-xs text-blue-600 hover:underline">Actualizar</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Monto</th>
                                    <th className="px-4 py-3">Método</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-mono">#{p.id}</td>
                                        <td className="px-4 py-3 font-bold">${p.monto}</td>
                                        <td className="px-4 py-3 uppercase text-xs">{p.metodo_pago}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                p.estado === 'approved' ? 'bg-green-100 text-green-700' : 
                                                p.estado === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {p.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(p.fecha_creacion).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-10 text-center text-gray-400">Sin transacciones registradas</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sync Monitor */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <h2 className="font-semibold text-gray-700 mb-4">Monitor de Sincronización</h2>
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-bold mb-1 uppercase">Cloud Sync Status</p>
                            <p className="text-sm text-blue-800">Namespaces multi-empresa activos. Reconciliación batch disponible.</p>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-500">Última señal recibida</span>
                            <span className="text-sm font-mono">{lastSync ? lastSync.toLocaleTimeString() : '--:--:--'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-500">Mobile Alerts Scaffolding</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsDashboard;

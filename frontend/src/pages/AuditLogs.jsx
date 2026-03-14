import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
// Elimino date-fns para evitar dependencias externas no instaladas
// import { format } from 'date-fns';
// import { es } from 'date-fns/locale';
import {
    History,
    Search,
    User,
    Activity,
    Database,
    Info,
    Calendar,
    Globe,
    Tag
} from 'lucide-react';

const AuditLogs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(100);

    const { data: logs, isLoading, error } = useQuery({
        queryKey: ['audit-logs', limit],
        queryFn: async () => {
            const response = await api.get(`/reportes/auditoria?limit=${limit}`);
            return response.data;
        }
    });

    const filteredLogs = logs?.filter(log =>
        log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.payload?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionBadge = (action) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('crear') || actionLower.includes('emitir'))
            return 'bg-green-100 text-green-800 border-green-200';
        if (actionLower.includes('actualizar') || actionLower.includes('editar'))
            return 'bg-blue-100 text-blue-800 border-blue-200';
        if (actionLower.includes('eliminar') || actionLower.includes('borrar'))
            return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200 m-6">
            <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800">Error al cargar la auditoría</h3>
            <p className="text-red-600">No se pudieron recuperar los logs. Por favor, reintenta más tarde.</p>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <History className="w-8 h-8 text-indigo-600" />
                        Auditoría de Acciones
                    </h1>
                    <p className="text-gray-500 mt-1">Trazabilidad completa de "quién hizo qué y cuándo" en el sistema.</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value={50}>Últimos 50</option>
                        <option value={100}>Últimos 100</option>
                        <option value={500}>Últimos 500</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por acción, usuario o entidad..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Fecha y Hora</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Entidad</th>
                                <th className="px-6 py-4">Detalles / IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLogs?.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(log.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{log.usuario_nombre || 'Sistema'}</p>
                                                    <p className="text-xs text-gray-500">{log.usuario_email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadge(log.accion)}`}>
                                                {log.accion.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Database className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-800">{log.entidad}</span>
                                                {log.entidad_id && (
                                                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                                                        ID: {log.entidad_id}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Globe className="w-3 h-3" />
                                                    {log.ip}
                                                </div>
                                                {log.payload && log.payload !== '{}' && (
                                                    <button
                                                        onClick={() => console.log(JSON.parse(log.payload))}
                                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium text-left"
                                                        title={log.payload}
                                                    >
                                                        Ver Datos JSON
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron registros de auditoría.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;

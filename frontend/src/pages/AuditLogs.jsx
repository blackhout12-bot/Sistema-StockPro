import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import {
    History,
    Search,
    User,
    Database,
    Info,
    Calendar,
    Globe,
    Download,
    FileText
} from 'lucide-react';

const AuditLogs = () => {
    const [entidad, setEntidad] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [limit, setLimit] = useState(100);

    const { data: logs, isLoading, error } = useQuery({
        queryKey: ['audit-logs', limit, entidad, fechaInicio, fechaFin],
        queryFn: async () => {
            const params = new URLSearchParams({ limit });
            if (entidad) params.append('entidad', entidad);
            if (fechaInicio) params.append('fechaInicio', fechaInicio);
            if (fechaFin) params.append('fechaFin', fechaFin);
            
            const response = await api.get(`/auditoria?${params.toString()}`);
            return response.data;
        }
    });

    const getActionBadge = (action) => {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('crear') || actionLower.includes('emitir') || actionLower.includes('insert'))
            return 'bg-green-100 text-green-800 border-green-200';
        if (actionLower.includes('actualizar') || actionLower.includes('editar') || actionLower.includes('update'))
            return 'bg-blue-100 text-blue-800 border-blue-200';
        if (actionLower.includes('eliminar') || actionLower.includes('borrar') || actionLower.includes('delete'))
            return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const downloadCSV = () => {
        if (!logs || logs.length === 0) return;
        
        let csv = 'Fecha,Usuario,Email,IP,Accion,Entidad,EntidadID,ValorAnterior,ValorNuevo\n';
        logs.forEach(log => {
            const row = [
                log.fecha,
                log.usuario_nombre || 'Sistema',
                log.usuario_email || '',
                log.ip || '',
                log.accion,
                log.entidad,
                log.entidad_id || '',
                log.valor_anterior || '',
                log.valor_nuevo || ''
            ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',');
            csv += row + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "auditoria.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadMarkdown = () => {
        if (!logs || logs.length === 0) return;
        
        let md = '# Reporte de Auditoría Extendida\n\n';
        md += '| Fecha | Usuario | IP | Acción | Entidad | ID | Cambios |\n';
        md += '|---|---|---|---|---|---|---|\n';
        
        logs.forEach(log => {
            const user = log.usuario_nombre || 'Sistema';
            const action = log.accion.replace(/_/g, ' ');
            const changes = log.valor_nuevo ? 'Ver Detalles' : 'Eliminado/Solo Lectura';
            md += `| ${new Date(log.fecha).toLocaleString('es-ES')} | ${user} | ${log.ip || 'Local'} | ${action} | ${log.entidad} | ${log.entidad_id || '-'} | ${changes} |\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "auditoria.md");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200 m-6">
            <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800">Error al cargar la auditoría</h3>
            <p className="text-red-600">No se pudieron recuperar los logs o carece de permisos de administrador.</p>
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
                    <p className="text-gray-500 mt-1">Trazabilidad completa con filtros dinámicos directos a Base de Datos.</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition shadow-sm text-sm font-medium border border-indigo-200">
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={downloadMarkdown} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition shadow-sm text-sm font-medium border border-slate-200">
                        <FileText className="w-4 h-4" /> Markdown
                    </button>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value))}
                        className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    >
                        <option value={50}>Últimos 50</option>
                        <option value={100}>Últimos 100</option>
                        <option value={500}>Últimos 500</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Buscar por Entidad (Ej. Productos)..."
                            className="w-full px-3 py-2 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm opacity-90"
                            value={entidad}
                            onChange={(e) => setEntidad(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">Desde</label>
                        <input 
                            type="date" 
                            className="text-sm rounded-lg border-gray-200 shadow-sm opacity-90"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 font-medium">Hasta</label>
                        <input 
                            type="date" 
                            className="text-sm rounded-lg border-gray-200 shadow-sm opacity-90"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
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
                                <th className="px-6 py-4 max-w-xs">Cambios</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs?.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-900 font-medium tracking-tight">
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
                                                    <p className="font-semibold text-gray-900">{log.usuario_nombre || 'Sistema DB'}</p>
                                                    <p className="text-xs text-gray-500">{log.usuario_email || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${getActionBadge(log.accion)}`}>
                                                {log.accion?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Database className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-800">{log.entidad}</span>
                                                {log.entidad_id ? (
                                                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">
                                                        #{log.entidad_id}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1 text-[11px] text-gray-400 uppercase tracking-widest font-mono">
                                                    <Globe className="w-3 h-3" /> {log.ip || 'Local / Interno'}
                                                </div>
                                                {log.valor_anterior && log.valor_anterior !== '{}' && log.valor_anterior !== null && (
                                                    <details className="text-xs text-rose-600 cursor-pointer w-full group/detail">
                                                        <summary className="font-semibold hover:text-rose-800 outline-none user-select-none">Ver Estado Previo</summary>
                                                        <pre className="mt-1.5 p-2 bg-rose-50 rounded-lg border border-rose-100 overflow-x-auto text-[10px] text-rose-900">
                                                            {log.valor_anterior}
                                                        </pre>
                                                    </details>
                                                )}
                                                {log.valor_nuevo && log.valor_nuevo !== '{}' && log.valor_nuevo !== null && (
                                                    <details className="text-xs text-emerald-600 cursor-pointer w-full group/detail mt-1">
                                                        <summary className="font-semibold hover:text-emerald-800 outline-none user-select-none">Ver Estado Nuevo</summary>
                                                        <pre className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-100 overflow-x-auto text-[10px] text-emerald-900">
                                                            {log.valor_nuevo}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron registros de auditoría que coincidan con los filtros.
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

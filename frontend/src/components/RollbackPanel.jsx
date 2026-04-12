import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { RefreshCw, Undo2, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RollbackPanel = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState(false);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const res = await api.get('/superadmin/backups');
            setBackups(res.data || []);
        } catch (err) {
            toast.error('Error al cargar historial de backups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleRestore = async (backupId) => {
        if (!window.confirm(`¿Está seguro de restaurar el backup #${backupId}?`)) return;
        try {
            setRestoring(true);
            await api.post('/superadmin/rollback', { backupId });
            toast.success('Rollback aplicado exitosamente');
            // Quitamos el backup restaurado de la lista o refrescamos
            fetchBackups();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Falló el rollback');
        } finally {
            setRestoring(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><RefreshCw className="animate-spin mx-auto text-indigo-500 mb-4" /></div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Centro de Rollback</h2>
                    <p className="text-sm text-slate-500 font-medium">Restaurar entidades eliminadas recientemente</p>
                </div>
                <button onClick={fetchBackups} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200">
                    <RefreshCw className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-y border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">ID Backup</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Tipo</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Ejecutor</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Fecha Eliminación</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {backups.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">#{b.id}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${b.tipo==='empresa'?'bg-indigo-100 text-indigo-700':'bg-emerald-100 text-emerald-700'}`}>
                                        {b.tipo}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{b.usuario_ejecutor}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {format(new Date(b.fecha_eliminacion), 'PPp', { locale: es })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        disabled={restoring}
                                        onClick={() => handleRestore(b.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                        RESTORE
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {backups.length === 0 && (
                    <div className="py-16 text-center">
                        <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay backups disponibles</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RollbackPanel;

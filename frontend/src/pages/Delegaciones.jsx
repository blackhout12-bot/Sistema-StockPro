import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { ShieldAlert, UserPlus, Clock, XCircle, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Delegaciones = () => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ delegado_id: '', rol_asignado: '', fecha_fin: '' });

    // Cargar Catálogo de Usuarios
    const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: async () => (await api.get('/usuarios')).data });
    // Cargar Mis Delegaciones Activas
    const { data: delegaciones, isLoading } = useQuery({ queryKey: ['delegaciones'], queryFn: async () => (await api.get('/delegaciones')).data });

    const mutacionCrear = useMutation({
        mutationFn: async (payload) => api.post('/delegaciones', payload),
        onSuccess: () => {
            toast.success('Poderes Delegados exitosamente.');
            queryClient.invalidateQueries(['delegaciones']);
            setForm({ delegado_id: '', rol_asignado: '', fecha_fin: '' });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al delegar rol.');
        }
    });

    const mutacionRevocar = useMutation({
        mutationFn: async (id) => api.put(`/delegaciones/${id}/revocar`),
        onSuccess: () => {
            toast.success('Delegación Revocada y Terminada.');
            queryClient.invalidateQueries(['delegaciones']);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Fallo de revocación')
    });

    const handleCrear = (e) => {
        e.preventDefault();
        if (!form.delegado_id || !form.rol_asignado || !form.fecha_fin) return;
        mutacionCrear.mutate(form);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Delegación Organizacional" icon={ShieldAlert} description="Asignación temporal de privilegios inter-departamentales" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <UserPlus size={18} className="text-indigo-600"/> Nuevo Préstamo de Rol
                    </h3>
                    <form onSubmit={handleCrear} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Delegado (Receptor)</label>
                            <select value={form.delegado_id} onChange={e=>setForm({...form, delegado_id: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" required>
                                <option value="">Seleccione Usuario...</option>
                                {usuarios?.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Rol a Asignar</label>
                            <select value={form.rol_asignado} onChange={e=>setForm({...form, rol_asignado: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" required>
                                <option value="">Seleccione Rol Jerárquico...</option>
                                <option value="encargado">Encargado de Sucursal</option>
                                <option value="vendedor">Vendedor POS</option>
                                <option value="operador">Operador (Logística)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Finalización Límite</label>
                            <input type="datetime-local" value={form.fecha_fin} onChange={e=>setForm({...form, fecha_fin: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" required />
                        </div>
                        <button type="submit" disabled={mutacionCrear.isPending} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                            {mutacionCrear.isPending ? 'Delegando...' : 'Fimar Delegación'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-amber-500"/> Registro Histórico de Delegaciones
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="p-3 rounded-l-xl">Emisor</th>
                                    <th className="p-3">Receptor (Delegado)</th>
                                    <th className="p-3">Rol Prestado</th>
                                    <th className="p-3">Caducidad</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-right rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {delegaciones?.map(d => (
                                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 whitespace-nowrap"><span className="font-bold text-slate-800">{d.delegante_nombre}</span></td>
                                        <td className="p-3 whitespace-nowrap"><span className="font-medium text-slate-600">{d.delegado_nombre}</span></td>
                                        <td className="p-3 whitespace-nowrap"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded uppercase tracking-wider">{d.rol_asignado}</span></td>
                                        <td className="p-3 whitespace-nowrap text-slate-500 text-xs">{new Date(d.fecha_fin).toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            {d.estado === 'ACTIVO' ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-rose-500 mx-auto" />}
                                        </td>
                                        <td className="p-3 text-right">
                                            {d.estado === 'ACTIVO' && (
                                                <button onClick={() => mutacionRevocar.mutate(d.id)} className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[11px] rounded transition-colors uppercase">
                                                    Revocar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!delegaciones || delegaciones.length === 0) && (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No hay delegaciones organizacionales operativas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Delegaciones;

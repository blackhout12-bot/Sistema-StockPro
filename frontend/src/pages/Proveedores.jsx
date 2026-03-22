import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Truck, Mail, Phone, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Proveedores = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // ─── States ──────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProv, setEditingProv] = useState(null);

    const debounceRef = useRef(null);
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
    };

    // ─── Queries ─────────────────────────────────────────
    const { data: proveedores = [], isLoading, error, refetch } = useQuery({
        queryKey: ['proveedores'],
        queryFn: async () => {
            const res = await api.get('/proveedores');
            return res.data;
        }
    });

    // Filtro lado cliente
    const filteredProveedores = proveedores.filter(p => 
        p.razon_social.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.cuit && p.cuit.includes(debouncedSearch))
    );

    // ─── Mutations ───────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/proveedores', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['proveedores']);
            setShowModal(false);
            toast.success('Proveedor registrado');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al crear')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/proveedores/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['proveedores']);
            setShowModal(false);
            setEditingProv(null);
            toast.success('Proveedor actualizado');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al actualizar')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/proveedores/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['proveedores']);
            toast.success('Proveedor desactivado');
        },
        onError: (err) => toast.error('Error al eliminar')
    });

    const handleDelete = (id) => {
        if(window.confirm('¿Desactivar este proveedor?')) {
            deleteMutation.mutate(id);
        }
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Proveedores</h1>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                        Gestión de Contactos y Cuentas · {proveedores.length} Registrados
                    </p>
                </div>
                <button
                    onClick={() => { setEditingProv(null); setShowModal(true); }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-base text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-500 transition-all shadow-soft active:scale-95"
                >
                    <Plus size={16} />
                    Nuevo Proveedor
                </button>
            </div>

            {/* Filter Bar */}
            <div className="premium-card !p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Razón Social o CUIT..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <button onClick={() => refetch()} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-brand-600 rounded-xl transition-all">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="premium-card flex flex-col items-center justify-center py-20">
                    <RefreshCw size={32} className="animate-spin text-brand-300 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando...</p>
                </div>
            ) : error ? (
                <div className="premium-card bg-rose-50/50 flex flex-col items-center py-16">
                    <AlertCircle size={32} className="text-rose-400 mb-3" />
                    <p className="text-sm font-bold text-rose-600 font-mono">{error.message}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProveedores.map(prov => (
                        <div key={prov.id} className="premium-card hover:border-brand-300 transition-all group flex flex-col h-full">
                            <div className="p-5 flex-1 relative">
                                <span className={`absolute top-5 right-5 w-2 h-2 rounded-full ${prov.estado === 'ACTIVO' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Truck size={20} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-[15px] font-black text-slate-800 leading-tight mb-1">{prov.razon_social}</h3>
                                <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-4">CUIT: {prov.cuit || 'N/A'}</p>
                                
                                <div className="space-y-2 mt-4 text-xs font-semibold text-slate-500">
                                    <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400"/> {prov.email || '-'}</div>
                                    <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400"/> {prov.telefono || '-'}</div>
                                    <div className="flex items-start gap-2"><MapPin size={12} className="text-slate-400 mt-0.5 shrink-0"/> <span className="line-clamp-2">{prov.direccion || '-'}</span></div>
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
                                <button
                                    onClick={() => { setEditingProv(prov); setShowModal(true); }}
                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(prov.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredProveedores.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                            <p className="text-slate-400 font-bold">No se encontraron proveedores de acuerdo a los filtros.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
               <ProveedorModal 
                    onClose={() => setShowModal(false)}
                    initialData={editingProv}
                    onSave={(data) => {
                        if(editingProv) updateMutation.mutate({ id: editingProv.id, data });
                        else createMutation.mutate(data);
                    }}
                    isPending={createMutation.isPending || updateMutation.isPending}
               />
            )}
        </div>
    );
};

const ProveedorModal = ({ onClose, initialData, onSave, isPending }) => {
    const [formData, setFormData] = useState({
        razon_social: initialData?.razon_social || '',
        cuit: initialData?.cuit || '',
        condicion_fiscal: initialData?.condicion_fiscal || 'Responsable Inscripto',
        email: initialData?.email || '',
        telefono: initialData?.telefono || '',
        direccion: initialData?.direccion || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            {initialData ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-rose-500 shadow-sm">
                         <Plus size={20} className="rotate-45" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Razón Social *</label>
                        <input required type="text" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={formData.razon_social} onChange={e => setFormData({...formData, razon_social: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">CUIT</label>
                            <input type="text" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500" value={formData.cuit} onChange={e => setFormData({...formData, cuit: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Condición Fiscal</label>
                            <select className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={formData.condicion_fiscal} onChange={e => setFormData({...formData, condicion_fiscal: e.target.value})}>
                                <option value="Responsable Inscripto">Resp. Inscripto</option>
                                <option value="Monotributista">Monotributista</option>
                                <option value="Exento">Exento</option>
                                <option value="Consumidor Final">Consumidor Final</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                            <input type="email" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Teléfono</label>
                            <input type="text" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Dirección Física</label>
                        <input type="text" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={isPending} className="flex-[2] py-3 bg-brand-base text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-500 disabled:opacity-50 transition-all shadow-soft">
                            {isPending ? 'Guardando...' : 'Guardar Datos'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Proveedores;

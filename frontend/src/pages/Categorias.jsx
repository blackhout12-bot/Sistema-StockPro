import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { Plus, Search, Filter, Edit, Trash2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Categorias() {
    const { user } = useAuth();
    const { sucursales } = useBranch();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [sucursalFilter, setSucursalFilter] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [editingCat, setEditingCat] = useState(null);

    // Formulario local
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        sucursal_id: '',
        activo: true
    });

    // ── Queries ────────────────────────────────────────────────────────
    const { data: categorias = [], isLoading, error, refetch } = useQuery({
        queryKey: ['categorias', sucursalFilter, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (sucursalFilter) params.append('sucursal_id', sucursalFilter);
            if (searchTerm) params.append('buscar', searchTerm);
            const res = await api.get(`/categorias?${params}`);
            return res.data;
        }
    });

    // ── Mutations ──────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data, sucursal_id: data.sucursal_id ? Number(data.sucursal_id) : null };
            if (editingCat) {
                const res = await api.put(`/categorias/${editingCat.id}`, payload);
                return res.data;
            } else {
                const res = await api.post('/categorias', payload);
                return res.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categorias']);
            toast.success(editingCat ? 'Categoría actualizada' : 'Categoría creada');
            closeModal();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await api.delete(`/categorias/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categorias']);
            toast.success('Categoría eliminada');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'No se pudo eliminar')
    });

    // ── Handlers ───────────────────────────────────────────────────────
    const openModal = (cat = null) => {
        if (cat) {
            setEditingCat(cat);
            setFormData({
                nombre: cat.nombre || '',
                descripcion: cat.descripcion || '',
                sucursal_id: cat.sucursal_id || '',
                activo: cat.activo ?? true
            });
        } else {
            setEditingCat(null);
            setFormData({ nombre: '', descripcion: '', sucursal_id: '', activo: true });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCat(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta categoría? Si tiene productos asociados, no podrá ser borrada.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    // ── Renderizado Principal ──────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Categorías</h1>
                    {!isLoading && (
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                            Clasificación de Inventario · {categorias.length} Registros
                        </p>
                    )}
                </div>
                {user?.rol?.toLowerCase() !== 'vendedor' && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-95"
                    >
                        <Plus size={16} />
                        Nueva Categoría
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="premium-card !p-5 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar categoría..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative w-full lg:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none text-sm font-medium transition-all cursor-pointer appearance-none"
                        value={sucursalFilter}
                        onChange={(e) => setSucursalFilter(e.target.value)}
                    >
                        <option value="">Todas las sucursales</option>
                        {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Estado de Error */}
            {!isLoading && error && (
                <div className="premium-card bg-rose-50 border-rose-100 flex p-6 items-center gap-4">
                    <AlertCircle className="text-rose-500" />
                    <p className="text-rose-700 text-sm font-bold">Error al cargar las categorías: {error.message}</p>
                </div>
            )}

            {/* Tabla de Resultados */}
            {!isLoading && !error && (
                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sucursal</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categorias.map(cat => (
                                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400 font-bold">#{cat.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 text-sm">{cat.nombre}</p>
                                            {cat.descripcion && <p className="text-xs text-slate-400 truncate max-w-[200px]">{cat.descripcion}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                            {cat.sucursal_nombre || 'Todas (Global)'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                cat.activo 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {cat.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(cat)} className="p-2 text-slate-400 hover:text-primary-600 bg-white border border-slate-100 rounded-lg transition-all shadow-sm">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-100 rounded-lg transition-all shadow-sm">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categorias.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <p className="text-sm font-bold text-slate-400">No hay categorías que coincidan con los filtros.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Formulario */}
            {showModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-8 py-6 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tighter">
                                    {editingCat ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Completar todos los campos requeridos
                                </p>
                            </div>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre de la Categoría *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-300"
                                    placeholder="Ej: Herramientas Manuales"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sucursal (Opcional)</label>
                                <select
                                    className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer"
                                    value={formData.sucursal_id}
                                    onChange={e => setFormData({ ...formData, sucursal_id: e.target.value })}
                                >
                                    <option value="">Global (Todas las sucursales)</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción corta</label>
                                <textarea
                                    className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all resize-none placeholder:text-slate-300"
                                    placeholder="Opcional..."
                                    rows="3"
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                ></textarea>
                            </div>

                            <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="relative flex items-start">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={formData.activo}
                                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                    />
                                    <div className="h-5 w-5 rounded bg-slate-100 border border-slate-200 peer-checked:bg-primary-500 peer-checked:border-primary-600 transition-all flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800 leading-none">Categoría Activa</span>
                                    <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Disponible para productos</span>
                                </div>
                            </label>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-soft transition-all disabled:opacity-50"
                                >
                                    {saveMutation.isPending ? 'Guardando...' : 'Guardar Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

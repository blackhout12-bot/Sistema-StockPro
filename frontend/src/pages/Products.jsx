import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import ProductList from '../ProductList';
import ProductForm from '../ProductForm';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LIMIT = 20;

const Products = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // ── Estado de UI & Paginación ────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showLotesModal, setShowLotesModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // ── Filtros ──────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const debounceRef = useRef(null);
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setCurrentPage(1);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
    };

    // ── Queries (TanStack Query) ─────────────────────────────────
    const { data: qData, isLoading: loading, error: queryError, refetch: fetchProducts } = useQuery({
        queryKey: ['productos', currentPage, debouncedSearch, categoryFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage,
                limit: LIMIT,
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(categoryFilter && { categoria: categoryFilter }),
            });
            const res = await api.get(`/productos?${params}`);
            return res.data;
        },
        keepPreviousData: true
    });

    const products = Array.isArray(qData) ? qData : qData?.data || [];
    const total = Array.isArray(qData) ? qData.length : qData?.total || 0;
    const totalPages = Array.isArray(qData) ? 1 : qData?.totalPages || 1;
    const error = queryError?.response?.data?.error || queryError?.message;

    // ── Mutaciones (TanStack Query) ──────────────────────────────
    const addMutation = useMutation({
        mutationFn: (product) => api.post('/productos/crear', product),
        onSuccess: () => {
            queryClient.invalidateQueries(['productos']);
            setShowModal(false);
            toast.success('Producto creado exitosamente');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al agregar producto')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, productData }) => api.put(`/productos/editar/${id}`, productData),
        onSuccess: () => {
            queryClient.invalidateQueries(['productos']);
            setShowModal(false);
            setEditingProduct(null);
            toast.success('Producto actualizado exitosamente');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al actualizar producto')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/productos/eliminar/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['productos']);
            toast.success('Producto eliminado exitosamente');
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(p => p - 1);
            }
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al eliminar producto')
    });

    const addStockMutation = useMutation({
        mutationFn: (data) => api.post('/movimientos/registrar', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['productos']);
            setShowAddStockModal(false);
            setStockEntry({ cantidad: 1, nro_lote: '', fecha_vto: '' });
            toast.success('Stock actualizado correctamente');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al actualizar stock')
    });

    // ── Handlers ─────────────────────────────────────────────────
    const addProduct = (product) => addMutation.mutateAsync(product);
    const updateProduct = (id, productData) => updateMutation.mutateAsync({ id, productData });
    const deleteProduct = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto permanentemente?')) {
            deleteMutation.mutate(id);
        }
    };

    const openCreateModal = () => { setEditingProduct(null); setShowModal(true); };
    const openEditModal = (product) => { setEditingProduct(product); setShowModal(true); };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return toast.error('Seleccione un archivo CSV');
        
        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await api.post('/importacion/productos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Importación exitosa. ${res.data.creados} creados, ${res.data.actualizados} actualizados.`);
            setShowImportModal(false);
            setImportFile(null);
            queryClient.invalidateQueries(['productos']);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error importando archivo');
        } finally {
            setImporting(false);
        }
    };

    const handleViewLots = (product) => {
        setSelectedProduct(product);
        setShowLotesModal(true);
    };

    const handleAddStock = (product) => {
        setSelectedProduct(product);
        setShowAddStockModal(true);
    };

    const [stockEntry, setStockEntry] = useState({ cantidad: 1, nro_lote: '', fecha_vto: '' });

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Productos y Catálogo</h1>
                    {!loading && (
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                            Catálogo Maestro · {total} Productos Registrados
                        </p>
                    )}
                </div>
                {user?.rol?.toLowerCase() === 'admin' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <UploadCloud size={16} />
                            Importar CSV
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-95"
                        >
                            <Plus size={16} />
                            Nuevo Producto
                        </button>
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className="premium-card !p-5 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o descripción..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="relative w-full lg:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Filtrar categoría..."
                        className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <button
                    onClick={() => fetchProducts()}
                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Estado de carga - Skeletons */}
            {loading && (
                <div className="premium-card !p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="w-1/3 h-5 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-1/4 h-5 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-6 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                                    <div className="space-y-2 flex-1 max-w-sm">
                                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2"></div>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col gap-2 w-32">
                                    <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                                    <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estado de error */}
            {!loading && error && (
                <div className="premium-card bg-rose-50/50 border-rose-100 flex flex-col items-center gap-4 py-16">
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                        <AlertCircle size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-rose-900 font-black text-sm uppercase tracking-tight">Error de Conexión</p>
                        <p className="text-rose-500 text-xs font-bold mt-1 max-w-sm">{error}</p>
                    </div>
                    <button
                        onClick={fetchProducts}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <RefreshCw size={14} /> Reintentar Carga
                    </button>
                </div>
            )}

            {/* Tabla */}
            {!loading && !error && (
                <div className="premium-card !p-0 overflow-hidden">
                    <ProductList
                        products={products}
                        onEdit={openEditModal}
                        onDelete={deleteProduct}
                        onViewLots={handleViewLots}
                        onAddStock={handleAddStock}
                        userRole={user?.rol}
                    />

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="px-10 py-6 bg-surface-50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                                Página {currentPage} de {totalPages} · {total} Items
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div className="flex gap-1.5">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === pageNum
                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-soft'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                                    {editingProduct ? 'Editar Producto' : 'Registro de Producto'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Complete los detalles técnicos
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-10">
                            <ProductForm
                                onAdd={addProduct}
                                onUpdate={updateProduct}
                                isModal={true}
                                closeModal={() => setShowModal(false)}
                                initialData={editingProduct}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lotes y Stock */}
            {(showLotesModal || showAddStockModal) && selectedProduct && (
                <Modal
                    title={showLotesModal ? 'Gestión de Lotes' : 'Ingreso de Mercadería'}
                    subtitle={selectedProduct.nombre}
                    onClose={() => { setShowLotesModal(false); setShowAddStockModal(false); }}
                >
                    {showLotesModal ? (
                        <ListadoLotes productoId={selectedProduct.id} />
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cantidad a Ingresar</label>
                                    <input
                                        type="number"
                                        className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all"
                                        value={stockEntry.cantidad}
                                        onChange={e => setStockEntry({ ...stockEntry, cantidad: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Número de Lote</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all uppercase placeholder:normal-case font-mono"
                                        value={stockEntry.nro_lote}
                                        onChange={e => setStockEntry({ ...stockEntry, nro_lote: e.target.value })}
                                        placeholder="Ej: LOTE-A1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha de Vencimiento</label>
                                <input
                                    type="date"
                                    className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all"
                                    value={stockEntry.fecha_vto}
                                    onChange={e => setStockEntry({ ...stockEntry, fecha_vto: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowAddStockModal(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => addStockMutation.mutate({
                                        productoId: selectedProduct.id,
                                        tipo: 'entrada',
                                        cantidad: stockEntry.cantidad,
                                        nro_lote: stockEntry.nro_lote,
                                        fecha_vto: stockEntry.fecha_vto
                                    })}
                                    disabled={addStockMutation.isPending}
                                    className="flex-[2] px-6 py-3 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-soft active:scale-[0.98] disabled:opacity-50"
                                >
                                    {addStockMutation.isPending ? 'Procesando...' : 'Confirmar Ingreso'}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

const Modal = ({ title, subtitle, children, onClose }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center text-left">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">{title}</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                        {subtitle}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
                >
                    <Plus size={24} className="rotate-45" />
                </button>
            </div>
            <div className="p-10">{children}</div>
        </div>
    </div>
);

const ListadoLotes = ({ productoId }) => {
    const { data: lotes, isLoading } = useQuery({
        queryKey: ['lotes', productoId],
        queryFn: async () => {
            const res = await api.get(`/productos/${productoId}/lotes`);
            return res.data;
        }
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Datos...</p>
        </div>
    );

    return (
        <div className="overflow-hidden border border-slate-100 rounded-2xl bg-surface-50">
            <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Lote / Serie</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Vencimiento</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {lotes?.map(l => (
                        <tr key={l.id} className="hover:bg-white transition-colors">
                            <td className="px-6 py-4 px-6 py-4">
                                <span className="font-mono text-primary-600 font-black text-xs uppercase">#{l.nro_lote || 'GNR-01'}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-black text-slate-700 text-sm font-mono">{l.cantidad}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-400">
                                {l.fecha_vto ? new Date(l.fecha_vto).toLocaleDateString() : 'INDETERMINADO'}
                            </td>
                        </tr>
                    ))}
                    {lotes?.length === 0 && (
                        <tr>
                            <td colSpan="3" className="px-6 py-12 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-60">Sin lotes activos</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Products;

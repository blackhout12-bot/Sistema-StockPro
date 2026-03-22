import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { Search, Eye, PackageCheck, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Package, Calculator, FileText, X } from 'lucide-react';

const Kardex = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducto, setSelectedProducto] = useState(null);

    // ─── Queries ─────────────────────────────────────────
    const { data: valorizado, isLoading, error, refetch } = useQuery({
        queryKey: ['kardex-valorizado'],
        queryFn: async () => {
            const res = await api.get('/kardex/valorizado');
            return res.data;
        }
    });

    const productos = valorizado?.detalles || [];
    const totalCapital = valorizado?.total_valorizado || 0;

    const filteredProductos = productos.filter(p => 
        (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col justify-between items-start gap-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Kardex y Valorización</h1>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                    Control de Trazabilidad y Costeo de Inventario Físico
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="premium-card !p-6 flex items-center gap-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Calculator size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Capital Inmovilizado Estimado</p>
                        <h2 className="text-3xl font-black text-indigo-950">${Number(totalCapital).toLocaleString('es-AR')}</h2>
                    </div>
                </div>
                <div className="premium-card !p-6 flex items-center gap-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <PackageCheck size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">SKUs con Stock Activo</p>
                        <h2 className="text-3xl font-black text-emerald-950">{productos.length} <span className="text-sm text-emerald-600 font-bold">productos</span></h2>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="premium-card !p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de producto..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={() => refetch()} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Listado */}
            {isLoading ? (
                <div className="premium-card flex flex-col items-center justify-center py-20">
                    <RefreshCw size={32} className="animate-spin text-indigo-300 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculando valoración...</p>
                </div>
            ) : error ? (
                <div className="premium-card bg-rose-50/50 flex flex-col items-center py-16">
                    <AlertCircle size={32} className="text-rose-400 mb-3" />
                    <p className="text-sm font-bold text-rose-600 font-mono">{error.message}</p>
                </div>
            ) : (
                <div className="premium-card !p-0 overflow-hidden text-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4 text-center">Stock Físico</th>
                                <th className="px-6 py-4 text-right">Últ. Costo Adq.</th>
                                <th className="px-6 py-4 text-right">Valor Total Estimado</th>
                                <th className="px-6 py-4 text-center">Kardex</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProductos.map(prod => (
                                <tr key={prod.producto_id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{prod.nombre}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-black text-slate-600">
                                        {Number(prod.stock).toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-500">
                                        ${Number(prod.ultimo_costo || 0).toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-indigo-600">
                                        ${Number(prod.valor_total).toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => setSelectedProducto(prod)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm border border-indigo-100">
                                            <FileText size={12}/> Trazabilidad
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProductos.length === 0 && (
                                <tr><td colSpan="5" className="py-16 text-center text-slate-400 font-bold">No existen productos valorizados en stock.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedProducto && (
                <KardexHistoryModal producto={selectedProducto} onClose={() => setSelectedProducto(null)} />
            )}
        </div>
    );
};

const KardexHistoryModal = ({ producto, onClose }) => {
    const { data: historial, isLoading } = useQuery({
        queryKey: ['kardex-producto', producto.producto_id],
        queryFn: async () => {
             const res = await api.get(`/kardex/${producto.producto_id}`);
             return res.data;
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="px-8 py-6 bg-indigo-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black tracking-tighter">Libro Kardex</h3>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">{producto.nombre}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-rose-500 transition-colors">
                         <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-surface-50">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
                    ) : (
                        <div className="space-y-6">
                            
                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-black text-slate-500 tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-slate-200" colSpan="3">Transacción</th>
                                            <th className="px-4 py-3 border-r border-slate-200 text-center bg-indigo-50/50" colSpan="3">Movimiento</th>
                                            <th className="px-4 py-3 text-center bg-slate-100/50" colSpan="2">Saldos</th>
                                        </tr>
                                        <tr className="border-t border-slate-100">
                                            <th className="px-4 py-2">Fecha</th>
                                            <th className="px-4 py-2">Origen</th>
                                            <th className="px-4 py-2 border-r border-slate-200">Ref</th>

                                            <th className="px-4 py-2 text-center bg-indigo-50/50">Tipo</th>
                                            <th className="px-4 py-2 text-right bg-indigo-50/50">Cant</th>
                                            <th className="px-4 py-2 text-right bg-indigo-50/50 border-r border-slate-200">Total $</th>

                                            <th className="px-4 py-2 text-right bg-slate-100/50">Cant</th>
                                            <th className="px-4 py-2 text-right bg-slate-100/50">Valorizado $</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {historial?.map((mov) => {
                                            const isIngreso = mov.tipo_movimiento === 'ENTRADA';
                                            return (
                                                <tr key={mov.id} className="hover:bg-slate-50 text-xs font-bold text-slate-700">
                                                    <td className="px-4 py-3">{new Date(mov.fecha).toLocaleString()}</td>
                                                    <td className="px-4 py-3">{mov.origen}</td>
                                                    <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-400">#{mov.referencia_id}</td>
                                                    
                                                    <td className="px-4 py-3 text-center bg-indigo-50/10">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest ${isIngreso ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {isIngreso ? <ArrowDownRight size={10}/> : <ArrowUpRight size={10}/>}
                                                            {mov.tipo_movimiento}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-mono bg-indigo-50/10 ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isIngreso ? '+' : '-'}{mov.cantidad}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono bg-indigo-50/10 border-r border-slate-200 text-slate-500">
                                                        ${Number(mov.costo_total).toLocaleString('es-AR')}
                                                    </td>

                                                    <td className="px-4 py-3 text-right font-mono bg-slate-50/50 font-black">
                                                        {mov.saldo_cantidad}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono bg-slate-50/50 font-black text-indigo-700">
                                                        ${Number(mov.saldo_valorado).toLocaleString('es-AR')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!historial || historial.length === 0) && (
                                            <tr><td colSpan="8" className="py-10 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Sin movimientos registrados.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-500 text-center font-bold tracking-widest uppercase">
                                Fin del historial para este producto
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Kardex;

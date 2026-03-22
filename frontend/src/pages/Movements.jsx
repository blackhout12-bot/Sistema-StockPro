import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Hammer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getRubroSchema } from '../config/rubroSchemas';

const Movements = () => {
    const { token, featureToggles, empresaConfig } = useAuth();
    const [movements, setMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [depositos, setDepositos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showProdModal, setShowProdModal] = useState(false);

    const activeSchema = getRubroSchema(empresaConfig?.rubro || 'general');
    const hasLotes = featureToggles?.mod_lotes || activeSchema.stockRules?.requires_lote;

    // Form state (Ajuste)
    const [formData, setFormData] = useState({
        productoId: '',
        deposito_id: '',
        tipo: 'entrada',
        cantidad: ''
    });

    const [transferData, setTransferData] = useState({
        producto_id: '',
        origen_id: '',
        destino_id: '',
        cantidad: '',
        motivo: ''
    });

    // Form state (Produccion)
    const [prodData, setProdData] = useState({
        insumo_id: '',
        terminado_id: '',
        cantidad_insumo: '',
        cantidad_terminado: ''
    });

    useEffect(() => {
        if (token) {
            fetchMovements();
            fetchProducts();
            fetchDepositos();
        }
    }, [token]);

    const fetchMovements = async () => {
        try {
            const res = await api.get('/movimientos');
            const sorted = res.data.sort((a, b) => {
                const dateA = new Date(a.fecha);
                const dateB = new Date(b.fecha);
                if (dateB - dateA !== 0) return dateB - dateA;
                return b.id - a.id;
            });
            setMovements(sorted);
        } catch (err) {
            console.error('Error al cargar movimientos:', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/productos');
            setProducts(res.data);
        } catch (err) {
            console.error('Error al cargar productos:', err);
        }
    };

    const fetchDepositos = async () => {
        try {
            const res = await api.get('/empresa/configuracion/depositos');
            // Filter only active for selectors
            setDepositos(res.data.filter(d => d.activo));
        } catch (err) {
            console.error('Error al cargar depositos:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                productoId: Number(formData.productoId),
                cantidad: Number(formData.cantidad)
            };
            if (payload.deposito_id) {
                payload.deposito_id = Number(payload.deposito_id);
            } else {
                delete payload.deposito_id;
            }
            await api.post('/movimientos/registrar', payload);
            setShowModal(false);
            setFormData({ productoId: '', deposito_id: '', tipo: 'entrada', cantidad: '', nro_lote: '', fecha_vto: '' });
            fetchMovements();
            toast.success('Movimiento registrado con éxito');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al registrar movimiento');
        }
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...transferData,
                producto_id: Number(transferData.producto_id),
                origen_id: Number(transferData.origen_id),
                destino_id: Number(transferData.destino_id),
                cantidad: Number(transferData.cantidad)
            };
            if (payload.origen_id === payload.destino_id) {
                return toast.error('El origen y destino no pueden ser iguales');
            }
            await api.post('/movimientos/transferir', payload);
            setShowTransferModal(false);
            setTransferData({ producto_id: '', origen_id: '', destino_id: '', cantidad: '', motivo: '' });
            fetchMovements();
            toast.success('Transferencia exitosa');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error en la transferencia');
        }
    };

    const handleProduccionSubmit = async (e) => {
        e.preventDefault();
        if (prodData.insumo_id === prodData.terminado_id) return toast.error('El insumo y el producto terminado no pueden ser el mismo');
        try {
            await api.post('/movimientos/registrar', {
                productoId: Number(prodData.insumo_id),
                tipo: 'salida',
                cantidad: Number(prodData.cantidad_insumo)
            });
            await api.post('/movimientos/registrar', {
                productoId: Number(prodData.terminado_id),
                tipo: 'entrada',
                cantidad: Number(prodData.cantidad_terminado)
            });
            setShowProdModal(false);
            setProdData({ insumo_id: '', terminado_id: '', cantidad_insumo: '', cantidad_terminado: '' });
            fetchMovements();
            toast.success('Orden de Producción ejecutada exitosamente');
        } catch (err) {
            toast.error('Error al procesar la orden de producción. Verifique existencias.');
        }
    };

    const getProductName = (id) => {
        const prod = products.find(p => p.id === id);
        return prod ? prod.nombre : `ID: ${id}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Historial de Operaciones</h1>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                        Trazabilidad de Inventario · {movements.length} Registros
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {featureToggles?.mod_produccion && (
                        <button
                            onClick={() => setShowProdModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-indigo-700 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        >
                            <Hammer size={16} />
                            Orden Producción
                        </button>
                    )}
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowRightLeft size={16} />
                        Transferir
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-95"
                    >
                        <Plus size={16} />
                        Ajustar Stock
                    </button>
                </div>
            </div>

            {/* Tabla de Movimientos */}
            <div className="premium-card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-10 py-5">Sincronización/Fecha</th>
                                <th className="px-10 py-5">Producto/Referencia</th>
                                <th className="px-6 py-5">Trazabilidad/Lote</th>
                                <th className="px-6 py-5 text-center">Naturaleza</th>
                                <th className="px-10 py-5 text-right">Magnitud</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {movements.map((mov) => (
                                <tr key={mov.id} className="hover:bg-primary-50/20 transition-colors group">
                                    <td className="px-10 py-5">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">
                                            {new Date(mov.fecha).toLocaleDateString()}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                                            {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-10 py-5">
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">
                                            {getProductName(mov.productoId)}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">ID Almacén: #{mov.productoId}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-[10px] font-black text-slate-500 uppercase">
                                                {mov.nro_lote || '—'}
                                            </span>
                                            {mov.fecha_vto && (
                                                <span className="text-[9px] font-bold text-amber-500 uppercase">
                                                    Vence: {new Date(mov.fecha_vto).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${mov.tipo.toLowerCase().includes('entrada')
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : mov.tipo.toLowerCase().includes('salida') ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full ${mov.tipo.toLowerCase().includes('entrada') ? 'bg-emerald-500' : mov.tipo.toLowerCase().includes('salida') ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                                            {mov.tipo.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-10 py-5 text-right">
                                        <span className={`font-mono font-black text-sm tracking-tighter ${mov.tipo.toLowerCase().includes('entrada') ? 'text-emerald-600' : mov.tipo.toLowerCase().includes('salida') ? 'text-rose-600' : 'text-indigo-600'}`}>
                                            {mov.tipo.toLowerCase().includes('entrada') ? '+' : '-'}{mov.cantidad}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-16 h-16 bg-surface-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100">
                                                <ArrowUpRight size={32} strokeWidth={1.5} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin registros de actividad</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Registrar Movimiento */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center text-left">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter">Ajuste de Saldo</h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Modificación Manual de Almacén
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
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Producto a Intervenir</label>
                                    <select
                                        required
                                        className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all appearance-none"
                                        value={formData.productoId}
                                        onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                                    >
                                        <option value="">Seleccione SKU/Nombre...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre.toUpperCase()} · STOCK: {p.stock}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Naturaleza del Ajuste</label>
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-50 border border-slate-100 rounded-2xl">
                                        <button
                                            type="button"
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.tipo === 'entrada' ? 'bg-white shadow-soft text-emerald-600 border border-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                                            onClick={() => setFormData({ ...formData, tipo: 'entrada' })}
                                        >
                                            Incremento (+)
                                        </button>
                                        <button
                                            type="button"
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.tipo === 'salida' ? 'bg-white shadow-soft text-rose-600 border border-rose-50' : 'text-slate-400 hover:text-slate-600'}`}
                                            onClick={() => setFormData({ ...formData, tipo: 'salida' })}
                                        >
                                            Decremento (-)
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Depósito (Opcional)</label>
                                        <select
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all appearance-none"
                                            value={formData.deposito_id}
                                            onChange={(e) => setFormData({ ...formData, deposito_id: e.target.value })}
                                        >
                                            <option value="">Depósito Principal por defecto</option>
                                            {depositos.map(d => (
                                                <option key={d.id} value={d.id}>{d.nombre.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Magnitud / Cantidad</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono"
                                            value={formData.cantidad}
                                            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {formData.tipo === 'entrada' && hasLotes && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Referencia Lote</label>
                                            <input
                                                type="text"
                                                placeholder="REF-..."
                                                className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono uppercase"
                                                value={formData.nro_lote || ''}
                                                onChange={(e) => setFormData({ ...formData, nro_lote: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expiración</label>
                                            <input
                                                type="date"
                                                className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all"
                                                value={formData.fecha_vto || ''}
                                                onChange={(e) => setFormData({ ...formData, fecha_vto: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="pt-6 flex gap-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Anular
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-6 py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-[0.98]"
                                    >
                                        Registrar Auditoría
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Transferencias Multi-Almacén */}
            {showTransferModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center text-left">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter">Transferencia Multi-Almacén</h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Mover stock entre sucursales
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-10">
                            <form onSubmit={handleTransferSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Producto a Transferir</label>
                                    <select
                                        required
                                        className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all appearance-none"
                                        value={transferData.producto_id}
                                        onChange={(e) => setTransferData({ ...transferData, producto_id: e.target.value })}
                                    >
                                        <option value="">Seleccione SKU/Nombre...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Depósito Origen</label>
                                        <select
                                            required
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all appearance-none"
                                            value={transferData.origen_id}
                                            onChange={(e) => setTransferData({ ...transferData, origen_id: e.target.value })}
                                        >
                                            <option value="">Seleccione Origen...</option>
                                            {depositos.map(d => (
                                                <option key={d.id} value={d.id}>[-] {d.nombre.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Depósito Destino</label>
                                        <select
                                            required
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-emerald-600 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all appearance-none"
                                            value={transferData.destino_id}
                                            onChange={(e) => setTransferData({ ...transferData, destino_id: e.target.value })}
                                        >
                                            <option value="">Seleccione Destino...</option>
                                            {depositos.map(d => (
                                                <option key={d.id} value={d.id}>[+] {d.nombre.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cantidad Mover</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono"
                                            value={transferData.cantidad}
                                            onChange={(e) => setTransferData({ ...transferData, cantidad: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Motivo / Ref (Opc)</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Reabastecimiento"
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all uppercase"
                                            value={transferData.motivo}
                                            onChange={(e) => setTransferData({ ...transferData, motivo: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                                        onClick={() => setShowTransferModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-6 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-soft active:scale-[0.98]"
                                    >
                                        Ejecutar Transferencia
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Produccion */}
            {showProdModal && featureToggles?.mod_produccion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center text-left">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter">Orden de Producción</h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Transformación de Materiales
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProdModal(false)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-10">
                            <form onSubmit={handleProduccionSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="col-span-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Consumo (Materia Prima)</h4>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Insumo Base</label>
                                        <select
                                            required
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all appearance-none"
                                            value={prodData.insumo_id}
                                            onChange={(e) => setProdData({ ...prodData, insumo_id: e.target.value })}
                                        >
                                            <option value="">Seleccione Insumo...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cantidad Usada</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all font-mono"
                                            value={prodData.cantidad_insumo}
                                            onChange={(e) => setProdData({ ...prodData, cantidad_insumo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                    <div className="col-span-2">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Ingreso (Producto Terminado)</h4>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Producto Final</label>
                                        <select
                                            required
                                            className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all appearance-none"
                                            value={prodData.terminado_id}
                                            onChange={(e) => setProdData({ ...prodData, terminado_id: e.target.value })}
                                        >
                                            <option value="">Seleccione Ensamblaje...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Unidades Generadas</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-mono"
                                            value={prodData.cantidad_terminado}
                                            onChange={(e) => setProdData({ ...prodData, cantidad_terminado: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-6 flex gap-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                                        onClick={() => setShowProdModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-6 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-soft active:scale-[0.98]"
                                    >
                                        Ejecutar Ensamblaje
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Movements;

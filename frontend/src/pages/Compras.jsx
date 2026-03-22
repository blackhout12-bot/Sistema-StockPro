import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { Plus, Search, Eye, ShoppingCart, Truck, Calendar, DollarSign, X, CheckCircle, RefreshCw, AlertCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Compras = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(null);

    // ─── Queries ─────────────────────────────────────────
    const { data: compras = [], isLoading, error, refetch } = useQuery({
        queryKey: ['compras'],
        queryFn: async () => {
            const res = await api.get('/compras');
            return res.data;
        }
    });

    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores-activos'],
        queryFn: async () => {
            const res = await api.get('/proveedores');
            return res.data.filter(p => p.estado === 'ACTIVO');
        }
    });

    const { data: qData } = useQuery({
        queryKey: ['productos-simples'],
        queryFn: async () => {
            const res = await api.get('/productos?limit=500'); // Cargar suficientes para el dropdown
            return res.data;
        }
    });
    const productos = Array.isArray(qData) ? qData : qData?.data || [];

    // Filtro
    const filteredCompras = compras.filter(c => 
        (c.proveedor_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.numero_comprobante || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Compras y Abastecimiento</h1>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                        Recepción de Mercadería · {compras.length} Registros
                    </p>
                </div>
                <button
                    onClick={() => setShowFormModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-base text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-500 transition-all shadow-soft active:scale-95"
                >
                    <Plus size={16} />
                    Registrar Compra
                </button>
            </div>

            {/* Filter Bar */}
            <div className="premium-card !p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Proveedor o Comprobante..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={() => refetch()} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-brand-600 rounded-xl transition-all">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Listado */}
            {isLoading ? (
                <div className="premium-card flex flex-col items-center justify-center py-20">
                    <RefreshCw size={32} className="animate-spin text-brand-300 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando compras...</p>
                </div>
            ) : error ? (
                <div className="premium-card bg-rose-50/50 flex flex-col items-center py-16">
                    <AlertCircle size={32} className="text-rose-400 mb-3" />
                    <p className="text-sm font-bold text-rose-600 font-mono">{error.message}</p>
                </div>
            ) : (
                <div className="premium-card !p-0 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Fecha / Comprobante</th>
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCompras.map(compra => (
                                <tr key={compra.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{compra.numero_comprobante}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{new Date(compra.fecha_compra).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-700">{compra.proveedor_nombre}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{compra.tipo_comprobante}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                            compra.estado === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            <CheckCircle size={10} />
                                            {compra.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-black text-brand-600 block">${Number(compra.total).toLocaleString('es-AR')}</p>
                                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">IVA: ${Number(compra.impuestos).toLocaleString('es-AR')}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => setShowDetailModal(compra)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-300 rounded-lg transition-all shadow-sm">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCompras.length === 0 && (
                                <tr><td colSpan="5" className="py-16 text-center text-slate-400 font-bold">No hay compras registradas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Alta de Compra */}
            {showFormModal && (
               <CompraFormModal 
                    onClose={() => setShowFormModal(false)}
                    proveedores={proveedores}
                    productos={productos}
               />
            )}

            {/* Modal Detalle de Compra */}
            {showDetailModal && (
               <CompraDetailModal 
                    compraId={showDetailModal.id}
                    onClose={() => setShowDetailModal(null)}
               />
            )}
        </div>
    );
};

// ─── Modal Formulario Alta Compra ────────────────────
const CompraFormModal = ({ onClose, proveedores, productos }) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [cabecera, setCabecera] = useState({
        proveedor_id: '',
        numero_comprobante: '',
        tipo_comprobante: 'Factura A',
        fecha_compra: new Date().toISOString().slice(0, 10),
        estado_pago: 'PENDIENTE',
        metodo_pago: 'Efectivo',
    });
    const [detalles, setDetalles] = useState([]);

    const [selectedProd, setSelectedProd] = useState('');
    const [qty, setQty] = useState(1);
    const [cost, setCost] = useState('');

    const subtotal = detalles.reduce((acc, d) => acc + d.subtotal, 0);
    const impuestos = cabecera.tipo_comprobante === 'Factura A' ? subtotal * 0.21 : 0;
    const total = subtotal + impuestos;

    const addDetail = () => {
        if(!selectedProd || qty <= 0 || cost <= 0) return toast.error('Complete los datos del producto válidos.');
        const prod = productos.find(p => p.id === Number(selectedProd));
        if(!prod) return;

        const newItem = {
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            cantidad: Number(qty),
            precio_unitario: Number(cost),
            subtotal: Number(qty) * Number(cost)
        };
        setDetalles([...detalles, newItem]);
        setSelectedProd(''); setQty(1); setCost('');
    };

    const removeDetail = (idx) => {
        setDetalles(detalles.filter((_, i) => i !== idx));
    };

    const submitMutation = useMutation({
        mutationFn: (payload) => api.post('/compras', payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['compras']);
            // Invalidate products because stock increased
            queryClient.invalidateQueries(['productos']);
            toast.success('Compra y Stock registrados con éxito!');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al procesar compra')
    });

    const handleFinalSubmit = () => {
        if(!cabecera.proveedor_id || !cabecera.numero_comprobante) return toast.error('Complete los campos obligatorios del proveedor y comprobante');
        if(detalles.length === 0) return toast.error('Debe agregar al menos un producto a la compra');

        const payload = {
            ...cabecera,
            subtotal,
            impuestos,
            total,
            detalles: detalles.map(d => ({
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal
            }))
        };
        submitMutation.mutate(payload);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Header */}
                <div className="px-8 py-6 bg-brand-900 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-black tracking-tighter">Registrar Ingreso de Mercadería</h3>
                        <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest mt-1">
                            Paso {step} de 2
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-rose-500 transition-colors">
                         <X size={18} />
                    </button>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto p-8 bg-surface-50">
                    
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-left-4">
                            <h4 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest pb-2 border-b border-slate-200">
                                <Truck size={14} /> Datos del Comprobante
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Proveedor *</label>
                                    <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={cabecera.proveedor_id} onChange={e => setCabecera({...cabecera, proveedor_id: e.target.value})}>
                                        <option value="">-- Seleccionar Proveedor --</option>
                                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social} (CUIT: {p.cuit})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tipo Comprobante</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={cabecera.tipo_comprobante} onChange={e => setCabecera({...cabecera, tipo_comprobante: e.target.value})}>
                                            <option value="Factura A">Factura A (Con IVA)</option>
                                            <option value="Factura C">Factura C (Sin IVA)</option>
                                            <option value="Remito">Remito Interno</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nº Comprobante *</label>
                                        <input type="text" placeholder="0001-00001234" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500" value={cabecera.numero_comprobante} onChange={e => setCabecera({...cabecera, numero_comprobante: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fecha Emisión</label>
                                    <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={cabecera.fecha_compra} onChange={e => setCabecera({...cabecera, fecha_compra: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado de Pago</label>
                                        <select className="w-full bg-emerald-50 text-emerald-800 border-emerald-200 border rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500" value={cabecera.estado_pago} onChange={e => setCabecera({...cabecera, estado_pago: e.target.value})}>
                                            <option value="PENDIENTE">DEJAR PENDIENTE (Generar Deuda CXP)</option>
                                            <option value="PAGADO">MARCAR PAGADO</option>
                                        </select>
                                    </div>
                                     {cabecera.estado_pago === 'PAGADO' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Método de Pago</label>
                                            <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={cabecera.metodo_pago} onChange={e => setCabecera({...cabecera, metodo_pago: e.target.value})}>
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="Transferencia">Transferencia Bancaria</option>
                                                <option value="Cheque">Cheque</option>
                                            </select>
                                        </div>
                                     )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <h4 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest pb-2 border-b border-slate-200">
                                <Package size={14} /> Detalle de Ítems (Afectación de Stock)
                            </h4>
                            
                            {/* Añadir item box */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Producto</label>
                                    <select className="w-full bg-surface-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-500" value={selectedProd} onChange={e => setSelectedProd(e.target.value)}>
                                        <option value="">- Buscar Producto en Catálogo -</option>
                                        {productos.map(p => <option key={p.id} value={p.id}>{p.codigo_barras || 'S/C'} - {p.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-24">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Cant.</label>
                                    <input type="number" min="1" className="w-full bg-surface-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono font-bold outline-none text-center" value={qty} onChange={e => setQty(e.target.value)} />
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Costo Unit. ($)</label>
                                    <input type="number" step="0.01" min="0" className="w-full bg-surface-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono font-bold outline-none" value={cost} onChange={e => setCost(e.target.value)} />
                                </div>
                                <button onClick={addDetail} className="w-full md:w-auto px-5 py-2.5 bg-slate-800 text-white rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-slate-700 transition-colors">
                                    Añadir
                                </button>
                            </div>

                            {/* Detalles Table */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-center">Cantidad</th>
                                            <th className="px-4 py-3 text-right">Unitario</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                            <th className="px-4 py-3 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {detalles.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-sm text-slate-700">{d.producto_nombre}</td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">{d.cantidad}</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-500">${d.precio_unitario.toLocaleString('es-AR')}</td>
                                                <td className="px-4 py-3 text-right font-mono font-black text-slate-800">${d.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => removeDetail(i)} className="p-1.5 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-md">
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {detalles.length === 0 && (
                                            <tr><td colSpan="5" className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Añada ítems para verlos aquí</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Resume Panel */}
                            <div className="bg-brand-50 rounded-2xl p-5 border border-brand-100 flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-brand-700">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">${subtotal.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-brand-700 pb-2 border-b border-brand-200">
                                        <span>Impuestos (IVA):</span>
                                        <span className="font-mono">${impuestos.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-brand-900 pt-1">
                                        <span>Total:</span>
                                        <span className="font-mono">${total.toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                        Cancelar
                    </button>
                    <div className="flex gap-3">
                        {step === 2 && (
                            <button onClick={() => setStep(1)} className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                                Atrás
                            </button>
                        )}
                        {step === 1 ? (
                            <button onClick={() => {
                                if(!cabecera.proveedor_id) return toast.error('Seleccione un proveedor');
                                if(!cabecera.numero_comprobante) return toast.error('Ingrese el número de comprobante');
                                setStep(2);
                            }} className="px-6 py-3 bg-brand-base text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-md">
                                Siguiente: Detalle de Ítems
                            </button>
                        ) : (
                            <button onClick={handleFinalSubmit} disabled={submitMutation.isPending || detalles.length === 0} className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50">
                                {submitMutation.isPending ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                Confirmar y Procesar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Modal Consulta de Compra ─────────────────────────
const CompraDetailModal = ({ compraId, onClose }) => {
    const { data: compra, isLoading } = useQuery({
        queryKey: ['compra', compraId],
        queryFn: async () => {
             const res = await api.get(`/compras/${compraId}`);
             return res.data;
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Detalle de Compra</h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Ticket / Remito #{compraId}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-rose-500 shadow-sm"><X size={20} /></button>
                </div>
                
                <div className="p-8">
                    {isLoading || !compra ? (
                        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</p>
                                    <p className="text-sm font-bold text-slate-800">{compra.proveedor_nombre} <span className="text-xs font-normal text-slate-400 ml-1">({compra.proveedor_cuit})</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comprobante</p>
                                    <p className="text-sm font-black text-slate-800 uppercase">{compra.numero_comprobante}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Ingreso</p>
                                    <p className="text-sm font-bold text-slate-800">{new Date(compra.fecha_compra).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                                    <p className="text-xs font-black text-emerald-600">{compra.estado}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] flex items-center gap-1.5 font-black text-slate-400 uppercase tracking-widest mb-3"><ShoppingCart size={12}/> Productos Recibidos</h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                     <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                                            <tr>
                                                <th className="px-4 py-2">Item</th>
                                                <th className="px-4 py-2 text-center">Cant</th>
                                                <th className="px-4 py-2 text-right">Unitario</th>
                                                <th className="px-4 py-2 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {compra.detalles?.map(d => (
                                                <tr key={d.id}>
                                                    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{d.producto_nombre}</td>
                                                    <td className="px-4 py-2.5 text-center text-xs font-mono font-black text-slate-600">{d.cantidad}</td>
                                                    <td className="px-4 py-2.5 text-right text-xs font-mono text-slate-500">${Number(d.precio_unitario).toLocaleString('es-AR')}</td>
                                                    <td className="px-4 py-2.5 text-right text-xs font-mono font-black text-slate-800">${Number(d.subtotal).toLocaleString('es-AR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                     </table>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <div className="w-48 space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Subtotal</span> <span className="font-mono">${Number(compra.subtotal).toLocaleString('es-AR')}</span></div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100"><span>Impuestos</span> <span className="font-mono">${Number(compra.impuestos).toLocaleString('es-AR')}</span></div>
                                    <div className="flex justify-between text-sm font-black text-slate-800 pt-1"><span>Total Factura</span> <span className="font-mono text-brand-600">${Number(compra.total).toLocaleString('es-AR')}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Compras;

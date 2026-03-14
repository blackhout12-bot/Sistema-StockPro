import React, { useState, useEffect, useMemo } from 'react';
import { DownloadService } from '../utils/downloadService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Trash2, Search, FileText, CheckCircle, Package, User, CreditCard, ArrowRight, RefreshCw, Minus, ChevronDown, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// ── Componentes Atómicos Senior ──────────────────────────────────
const StatDetail = ({ label, value, color = "text-slate-900" }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-black tracking-tight ${color}`}>{value}</span>
    </div>
);

const POSButton = ({ onClick, disabled, children, variant = "primary", className = "" }) => {
    const variants = {
        primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-soft",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
        danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100",
        ghost: "bg-surface-50 border border-slate-100 hover:bg-slate-100 text-slate-500"
    };
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 shadow-sm ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

const Facturacion = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // ── Queries (TanStack Query) ─────────────────────────────────
    const { data: clientes = [], isLoading: loadingClientes } = useQuery({
        queryKey: ['clientes'],
        queryFn: async () => { const res = await api.get('/clientes'); return res.data; },
        enabled: !!token
    });

    const { data: productosBrutos = [], isLoading: loadingProductos } = useQuery({
        queryKey: ['productos'],
        queryFn: async () => { const res = await api.get('/productos'); return res.data; },
        enabled: !!token
    });

    const productos = useMemo(() => productosBrutos.filter(p => p.stock > 0), [productosBrutos]);

    const { data: empresa = {}, isLoading: loadingEmpresa } = useQuery({
        queryKey: ['empresa'],
        queryFn: async () => { const res = await api.get('/empresa'); return res.data; },
        enabled: !!token
    });


    const { data: historicoFacturas = [], isLoading: loadingFacturas, refetch: refetchFacturas } = useQuery({
        queryKey: ['historicoFacturas'],
        queryFn: async () => { const res = await api.get('/facturacion'); return res.data; },
        enabled: !!token
    });

    const { data: cotizaciones = { ARS: 1, USD: 1050 } } = useQuery({
        queryKey: ['cotizaciones'],
        queryFn: async () => { const res = await api.get('/monedas/cotizaciones'); return res.data; },
        enabled: !!token,
        refetchInterval: 1000 * 60 * 5 // Refrescar cada 5 min
    });

    const { data: configEmpresa } = useQuery({
        queryKey: ['config_empresa'],
        queryFn: async () => {
            const res = await api.get('/empresa/configuracion/completa');
            return res.data;
        },
        enabled: !!token
    });

    const comprobantesActivos = configEmpresa?.comprobantes?.filter(c => c.activo) || [];

    const isLoadingMaestros = loadingClientes || loadingProductos || loadingEmpresa || loadingFacturas;

    const cargarDatosMaestros = () => {
        queryClient.invalidateQueries(['clientes']);
        queryClient.invalidateQueries(['productos']);
        queryClient.invalidateQueries(['empresa']);
        queryClient.invalidateQueries(['historicoFacturas']);
    };

    // Estado del POS
    const [clienteId, setClienteId] = useState('');
    const [carrito, setCarrito] = useState([]);
    const [facturaAnterior, setFacturaAnterior] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagoCon, setPagoCon] = useState('');
    const [vuelto, setVuelto] = useState(0);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [tipoComprobante, setTipoComprobante] = useState('');
    const [monedaId, setMonedaId] = useState('ARS');

    // Quick Client Modal State
    const [showQuickClient, setShowQuickClient] = useState(false);
    const [quickClientForm, setQuickClientForm] = useState({ nombre: '', documento_identidad: '', telefono: '', direccion: '' });

    // Audit panel state
    const [auditSearch, setAuditSearch] = useState('');
    const [auditPage, setAuditPage] = useState(1);
    const AUDIT_PER_PAGE = 10;

    // MercadoPago State
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [externalRef, setExternalRef] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [paymentApproved, setPaymentApproved] = useState(false);

    const totalFacturaOriginal = useMemo(() => carrito.reduce((sum, item) => sum + item.subtotal, 0), [carrito]);
    const totalFactura = useMemo(() => {
        if (monedaId === 'USD') {
            return totalFacturaOriginal / (cotizaciones.USD || 1050);
        }
        return totalFacturaOriginal;
    }, [totalFacturaOriginal, monedaId, cotizaciones]);

    useEffect(() => {
        const pago = pagoCon === '' ? totalFactura : (parseFloat(pagoCon) || 0);
        if (pago >= totalFactura && totalFactura > 0) {
            setVuelto(pago - totalFactura);
        } else {
            setVuelto(0);
        }
    }, [pagoCon, totalFactura]);

    useEffect(() => {
        if (comprobantesActivos.length > 0 && !tipoComprobante) {
            setTipoComprobante(comprobantesActivos[0].tipo_comprobante);
        }
    }, [comprobantesActivos, tipoComprobante]);

    const productosFiltrados = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return productos.filter(p =>
            (p.nombre && String(p.nombre).toLowerCase().includes(lowerSearch)) ||
            (p.sku && String(p.sku).toLowerCase().includes(lowerSearch))
        ).slice(0, 5);
    }, [productos, searchTerm]);

    const handleAddFast = (prod) => {
        if (!clienteId) {
            toast.error('Debe seleccionar un cliente primero');
            return;
        }

        const enCarrito = carrito.find(item => item.producto_id === prod.id);
        const currentQty = enCarrito ? enCarrito.cantidad : 0;

        if (currentQty + 1 > prod.stock) {
            toast.error('Stock insuficiente');
            return;
        }

        if (enCarrito) {
            setCarrito(carrito.map(item =>
                item.producto_id === prod.id
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: item.precio_unitario * (item.cantidad + 1) }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                producto_id: prod.id,
                nombre: prod.nombre,
                cantidad: 1,
                precio_unitario: prod.precio,
                subtotal: prod.precio
            }]);
        }
        setSearchTerm('');
    };

    const eliminarDelCarrito = (id) => {
        setCarrito(carrito.filter(item => item.producto_id !== id));
    };

    const updateQty = (id, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.producto_id === id) {
                const newQty = Math.max(1, item.cantidad + delta);
                const originalProd = productos.find(p => p.id === id);
                if (delta > 0 && newQty > originalProd.stock) {
                    toast.error('Límite de stock alcanzado');
                    return item;
                }
                return { ...item, cantidad: newQty, subtotal: item.precio_unitario * newQty };
            }
            return item;
        }));
    };

    const descargarPDF = (id, nro, autoOpen = false) => {
        DownloadService.downloadPDF(id, nro, autoOpen, toast);
    };

    const emitInvoiceMutation = useMutation({
        mutationFn: (payload) => api.post('/facturacion', payload),
        onSuccess: (res) => {
            const facturaCompleta = res.data;
            toast.success('¡Venta emitida y stock actualizado!');

            if (facturaCompleta && facturaCompleta.fecha_emision) {
                const fe = facturaCompleta.fecha_emision;
                if (typeof fe === 'string' && fe.endsWith('Z')) {
                    facturaCompleta.fecha_emision = fe.slice(0, -1);
                }
            }

            if (facturaCompleta) {
                facturaCompleta.empresa_nombre_snapshot = facturaCompleta.empresa_nombre_snapshot || empresa.nombre;
                if (!facturaCompleta.detalles || facturaCompleta.detalles.length === 0) {
                    facturaCompleta.detalles = carrito.map(item => ({
                        producto_nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: item.subtotal
                    }));
                }
                setFacturaAnterior(facturaCompleta);
            }

            setCarrito([]);
            setClienteId('');
            setPagoCon('');
            setVuelto(0);
            setAuditPage(1);
            cargarDatosMaestros();
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error en el servidor';
            toast.error(`Fallo en facturación: ${errorMsg}`);
        }
    });

    const createClientMutation = useMutation({
        mutationFn: (payload) => api.post('/clientes', payload),
        onSuccess: (res) => {
            toast.success('Cliente creado con éxito');
            queryClient.invalidateQueries(['clientes']);
            setClienteId(res.data.id.toString());
            setShowQuickClient(false);
            setQuickClientForm({ nombre: '', documento_identidad: '', telefono: '', direccion: '' });
        },
        onError: (err) => toast.error('Error al crear cliente: ' + (err.response?.data?.error || err.message))
    });

    const handleQuickClientSubmit = (e) => {
        e.preventDefault();
        if (!quickClientForm.nombre || !quickClientForm.documento_identidad) {
            toast.error('Nombre y Documento son obligatorios');
            return;
        }
        createClientMutation.mutate(quickClientForm);
    };

    const facturar = () => {
        if (!clienteId) {
            toast.error('Debe seleccionar un cliente antes de completar la venta');
            return;
        }
        if (!tipoComprobante) {
            toast.error('Debe seleccionar un tipo de comprobante');
            return;
        }
        if (carrito.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        const pago = pagoCon === '' ? totalFactura : (parseFloat(pagoCon) || 0);
        if (pago < totalFactura) {
            toast.error(`Ingreso insuficiente. Faltan $${(totalFactura - pago).toFixed(2)}`);
            return;
        }

        const payload = {
            cliente_id: parseInt(clienteId),
            total: parseFloat(totalFactura.toFixed(2)),
            detalles: carrito,
            tipo_comprobante: tipoComprobante,
            metodo_pago: metodoPago,
            moneda_id: monedaId,
            tipo_cambio: monedaId === 'USD' ? (cotizaciones.USD || 1050) : 1,
            external_reference: externalRef // Vincular con el pago si existe
        };

        emitInvoiceMutation.mutate(payload);
    };

    // ── MercadoPago Flow ───────────────────────────────────────
    
    const generarQR = async () => {
        if (!clienteId || carrito.length === 0) {
            toast.error('Complete el carrito y seleccione un cliente');
            return;
        }
        
        const ref = `REF-${Date.now()}`;
        setExternalRef(ref);
        setQrData(null);
        setShowQRModal(true);
        setIsPolling(true);
        setPaymentApproved(false);

        try {
            const res = await api.post('/facturacion/mercadopago/qr', {
                total: totalFacturaOriginal, // MP suele cobrar en moneda local ARS
                external_reference: ref,
                title: `Venta POS - ${empresa.nombre}`
            });
            setQrData(res.data.qr_data);
        } catch (error) {
            toast.error('Error al generar QR');
            setShowQRModal(false);
        }
    };

    useEffect(() => {
        let interval;
        if (isPolling && externalRef && !paymentApproved) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/facturacion/mercadopago/status/${externalRef}`);
                    if (res.data.status === 'approved') {
                        setIsPolling(false);
                        setPaymentApproved(true);
                        toast.success('¡Pago Recibido!');
                        // Auto-emitir factura después de un breve delay
                        setTimeout(() => {
                            setShowQRModal(false);
                            facturar();
                        }, 1500);
                    }
                } catch (e) {
                    console.error('Error polling status', e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isPolling, externalRef, paymentApproved]);

    const renderInvoiceSummary = () => {
        if (!facturaAnterior) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-12 px-4 animate-in fade-in duration-300">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body > *:not(.invoice-print-root) { display: none !important; }
                        .invoice-print-root { 
                            position: fixed; inset: 0;
                            width: 100%; 
                            background: white;
                            padding: 20px;
                            z-index: 9999;
                        }
                        .no-print { display: none !important; }
                    }
                `}} />
                <div className="invoice-print-root bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="no-print flex justify-between items-center px-10 py-6 bg-surface-50 border-b border-slate-100">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                                <CheckCircle size={20} />
                            </div>
                            <span className="font-black text-sm uppercase tracking-widest">Documento Emitido con Éxito</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => descargarPDF(facturaAnterior.id, facturaAnterior.nro_factura)} className="flex items-center px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-soft group">
                                <FileText size={14} className="mr-2 group-hover:scale-110 transition-transform" /> Descargar
                            </button>
                            <button onClick={() => descargarPDF(facturaAnterior.id, facturaAnterior.nro_factura, true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-soft group">
                                <Search size={14} className="mr-2 group-hover:scale-110 transition-transform" /> Abrir
                            </button>
                            <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-soft">
                                <FileText size={14} className="mr-2" /> Imprimir
                            </button>
                            <button onClick={() => setFacturaAnterior(null)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest">Cerrar</span>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="p-12">
                        <div className="flex justify-between items-start pb-10 border-b border-slate-100 mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{facturaAnterior.empresa_nombre_snapshot}</h2>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-2">{facturaAnterior.empresa_direccion_snapshot || 'Sede Central'}</p>
                            </div>
                            <div className="text-right bg-primary-50 px-6 py-4 rounded-2xl border border-primary-100">
                                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Folio de Venta</p>
                                <p className="text-2xl font-mono font-black text-primary-600 tracking-tighter">#{facturaAnterior.nro_factura}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mb-10 text-xs">
                            <div className="bg-surface-50 rounded-2xl p-6 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Receptor</p>
                                <p className="font-black text-slate-800 uppercase">{facturaAnterior.cliente_nombre}</p>
                                <p className="text-slate-400 mt-1">DOC: {facturaAnterior.cliente_doc}</p>
                            </div>
                            <div className="bg-surface-50 rounded-2xl p-6 border border-slate-100 text-right">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Cajero / Responsable</p>
                                <p className="font-black text-slate-800 uppercase">{facturaAnterior.vendedor_nombre}</p>
                            </div>
                        </div>
                        <table className="w-full mb-10 border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-surface-50/50">
                                    <th className="py-4 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                                    <th className="py-4 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Cant.</th>
                                    <th className="py-4 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Vlr. Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {facturaAnterior.detalles?.map((d, idx) => (
                                    <tr key={idx}>
                                        <td className="py-5 px-4 text-xs font-black text-slate-800 uppercase tracking-tight">{d.producto_nombre || d.nombre}</td>
                                        <td className="py-5 px-4 text-center text-xs font-black text-slate-400 font-mono">x{d.cantidad}</td>
                                        <td className="py-5 px-4 text-right text-sm font-black text-slate-900 font-mono tracking-tighter">${Number(d.subtotal).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <div className="w-full max-w-[240px] space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="font-black text-slate-900 text-xs uppercase tracking-tighter">Total Liquidado</span>
                                    <span className="text-3xl font-black text-primary-600 font-mono tracking-tighter">${Number(facturaAnterior.total).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header POS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-premium">
                        <ShoppingCart size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase tracking-[-0.04em]">Punto de Venta</h1>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.3em] mt-1 ml-1">Facturación de Alto Rendimiento · {empresa.nombre}</p>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <button onClick={cargarDatosMaestros} className="p-3 bg-surface-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all shadow-sm">
                        <RefreshCw size={20} className={isLoadingMaestros ? 'animate-spin' : ''} />
                    </button>
                    <div className="h-12 w-[1.5px] bg-slate-100 hidden md:block" />
                    <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">En Línea</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 font-mono tracking-tighter leading-none">CAJA 01</p>
                    </div>
                </div>
            </div>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* 🛒 Column 1: Selector y Carrito */}
                <div className="xl:col-span-8 space-y-8">
                    {/* Buscador de Productos y Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Selector Cliente */}
                        <div className="premium-card !p-10 relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 -mr-16 -mt-16 rounded-full blur-2xl"></div>
                            <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 border border-primary-100 shadow-sm"><User size={16} /></div> CUIT / DNI del Cliente
                            </label>
                            <select className="w-full bg-surface-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 transition-all outline-none cursor-pointer appearance-none shadow-sm"
                                value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                                <option value="">Seleccionar Cliente...</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.documento_identidad}</option>)}
                            </select>
                            <div className="mt-4 flex items-center gap-2 ml-1">
                                <Plus size={14} className="text-primary-500" />
                                <span onClick={() => setShowQuickClient(true)} className="text-[9px] font-black text-primary-600 uppercase tracking-widest cursor-pointer hover:underline underline-offset-4">Nuevo Cliente Rápido</span>
                            </div>
                        </div>

                        {/* Buscador Productos */}
                        <div className="premium-card !p-10 relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 -mr-16 -mt-16 rounded-full blur-2xl"></div>
                            <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm"><Package size={16} /></div> Buscador de Productos
                            </label>
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="SKU o Nombre..." className="w-full bg-surface-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 rounded-2xl pl-14 pr-4 py-4 text-sm font-black text-slate-700 transition-all outline-none shadow-sm"
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            {productosFiltrados.length > 0 && (
                                <div className="absolute left-6 right-6 top-[calc(100%-8px)] bg-white rounded-3xl shadow-2xl border border-slate-100 z-[60] overflow-hidden divide-y divide-slate-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {productosFiltrados.map(p => (
                                        <div key={p.id} onClick={() => handleAddFast(p)} className="p-5 hover:bg-primary-50/50 cursor-pointer flex justify-between items-center group/item transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover/item:text-primary-600 group-hover/item:border-primary-100 transition-all"><Package size={20} /></div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.nombre}</p>
                                                    <span className={`text-[9px] font-black uppercase ${p.stock < 5 ? 'text-amber-500' : 'text-emerald-500'}`}>Stock: {p.stock}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <p className="text-base font-black text-slate-900 font-mono tracking-tighter">${p.precio.toLocaleString()}</p>
                                                    <p className="text-[8px] font-black text-primary-500 uppercase">Añadir al Carrito</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-soft group-hover/item:scale-110 transition-transform">
                                                    <Plus size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalle del Carrito */}
                    <div className="premium-card !p-0 overflow-hidden flex flex-col min-h-[500px] shadow-2xl">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <ShoppingCart size={18} className="text-primary-500" /> Renglones de Venta
                            </h3>
                            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-[11px] font-black text-primary-600 uppercase tracking-widest">
                                {carrito.length} {carrito.length === 1 ? 'Renglón' : 'Renglones'}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white border-b border-slate-50">
                                    <tr>
                                        <th className="px-10 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Item</th>
                                        <th className="px-10 py-5 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Dosificación</th>
                                        <th className="px-10 py-5 text-right text-[10px] font-black text-slate-300 uppercase tracking-widest">Subtotal</th>
                                        <th className="px-10 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {carrito.map(item => (
                                        <tr key={item.producto_id} className="hover:bg-primary-50/10 transition-all group border-b border-slate-50 last:border-0">
                                            <td className="px-10 py-7 whitespace-nowrap">
                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.nombre}</p>
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">#PROD-{item.producto_id}</span>
                                            </td>
                                            <td className="px-10 py-7">
                                                <div className="flex items-center justify-center gap-1.5 bg-surface-50/80 p-1 rounded-[1.25rem] w-max mx-auto border border-slate-100">
                                                    <button onClick={() => updateQty(item.producto_id, -1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-rose-600 border border-transparent transition-all"><Minus size={14} /></button>
                                                    <div className="min-w-[40px] text-center text-sm font-black text-slate-900 font-mono">{item.cantidad.toString().padStart(2, '0')}</div>
                                                    <button onClick={() => updateQty(item.producto_id, 1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-emerald-600 border border-transparent transition-all"><Plus size={14} /></button>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <p className="text-lg font-black text-slate-900 font-mono tracking-tighter">${item.subtotal.toLocaleString()}</p>
                                                <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-1">Precio Unit: ${item.precio_unitario.toLocaleString()}</span>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <button onClick={() => eliminarDelCarrito(item.producto_id)} className="w-11 h-11 flex items-center justify-center text-slate-200 hover:text-rose-500 bg-white border border-transparent rounded-2xl transition-all"><Trash2 size={20} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {carrito.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrito desocupado</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 💳 Column 2: Resumen y Cobro */}
                <div className="xl:col-span-4 space-y-6 lg:sticky lg:top-8">
                    <div className="premium-card !p-10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-b border-slate-50 pb-6 flex justify-between items-center">Resumen Contable <FileText size={14} /></h3>
                        <div className="space-y-1 mb-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moneda de Pago</span>
                                <div className="flex bg-surface-50 p-1 rounded-xl border border-slate-100">
                                    <button 
                                        onClick={() => setMonedaId('ARS')}
                                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${monedaId === 'ARS' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}
                                    >ARS</button>
                                    <button 
                                        onClick={() => setMonedaId('USD')}
                                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${monedaId === 'USD' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}
                                    >USD</button>
                                </div>
                            </div>
                            <StatDetail label="Subtotal (Neto)" value={`${monedaId === 'USD' ? 'U$D' : '$'} ${totalFactura.toLocaleString()}`} />
                            <StatDetail label={`IVA (${configEmpresa?.config_iva_defecto || 21}%)`} value={`${monedaId === 'USD' ? 'U$D' : '$'} ${(totalFactura * (configEmpresa?.config_iva_defecto || 21) / 100).toLocaleString()}`} />
                            
                            {monedaId === 'USD' && (
                                <div className="py-2 px-3 bg-amber-50 border border-amber-100 rounded-xl text-[9px] font-black text-amber-700 uppercase tracking-tight flex justify-between items-center">
                                    <span>Tasa de Cambio (DolarApi)</span>
                                    <span>$ {(cotizaciones.USD || 1050).toLocaleString()}</span>
                                </div>
                            )}

                            <div className="pt-10 mt-6 flex flex-col gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Total a Liquidar</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-primary-400 font-mono tracking-tighter">{monedaId === 'USD' ? 'U$D' : '$'}</span>
                                    <span className="text-6xl font-black text-slate-900 font-mono tracking-tighter leading-none">{totalFactura.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Panel Cobro */}
                        <div className="space-y-6 bg-surface-50 p-8 rounded-[2.5rem] border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Efectivo Ingresado</label>
                            <div className="relative mb-5">
                                <input type="number" placeholder="0.00" className="w-full bg-white border border-slate-100 focus:ring-4 focus:ring-primary-500/5 rounded-2xl px-6 py-5 text-3xl font-black text-slate-900 transition-all outline-none shadow-sm"
                                    value={pagoCon} onChange={(e) => setPagoCon(e.target.value)} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setPagoCon('')} className="flex-1 py-3 bg-white border border-slate-100 hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">Limpiar</button>
                                <button onClick={() => setPagoCon((Math.ceil(totalFactura / 10) * 10).toString())} className="flex-1 py-3 bg-white border border-slate-100 hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">+Redondeo</button>
                            </div>
                            {vuelto > 0 && (
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Cambio</span>
                                    <span className="text-2xl font-black font-mono tracking-tighter">${vuelto.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Comprobante / Pago */}
                        <div className="grid grid-cols-2 gap-4 mt-10 mb-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Comprobante</label>
                                <select className="w-full bg-surface-50 border border-slate-100 rounded-2xl px-4 py-4 text-[10px] font-black text-slate-700 outline-none uppercase tracking-wider"
                                    value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)}>
                                    <option value="">-- SELECCIONAR --</option>
                                    {comprobantesActivos.map(c => <option key={c.id} value={c.tipo_comprobante}>{c.tipo_comprobante}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Medio Pago</label>
                                <select className="w-full bg-surface-50 border border-slate-100 rounded-2xl px-4 py-4 text-[10px] font-black text-slate-700 outline-none uppercase tracking-wider"
                                    value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                    <option value="Efectivo">🛒 EFECTIVO</option>
                                    <option value="Transferencia">🏦 TRANSF.</option>
                                    <option value="Tarjeta">💳 TARJETA</option>
                                    <option value="MercadoPago">💙 MERCADOPAGO</option>
                                </select>
                            </div>
                        </div>

                        {metodoPago === 'MercadoPago' && !paymentApproved ? (
                             <button disabled={carrito.length === 0 || !clienteId} onClick={generarQR}
                                className="w-full h-20 bg-gradient-to-br from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white rounded-[1.8rem] shadow-premium transition-all active:scale-[0.98] flex items-center justify-between px-8 overflow-hidden relative">
                                <span className="text-xl font-black tracking-tighter uppercase">Generar QR de Pago</span>
                                <RefreshCw size={20} />
                            </button>
                        ) : (
                            <button disabled={emitInvoiceMutation.isPending || carrito.length === 0 || !clienteId} onClick={facturar}
                                className="w-full h-20 bg-gradient-to-br from-primary-600 to-indigo-700 hover:from-primary-700 hover:to-indigo-800 text-white rounded-[1.8rem] shadow-premium transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale flex items-center justify-between px-8 overflow-hidden relative">
                                <span className="text-xl font-black tracking-tighter uppercase tracking-[-0.02em]">{emitInvoiceMutation.isPending ? 'Procesando...' : 'Emitir Comprobante'}</span>
                                <ArrowRight size={20} />
                            </button>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[32px] p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4 opacity-80"><FileText size={18} /><h4 className="text-[10px] font-black uppercase tracking-widest">Info Fiscal</h4></div>
                        <p className="text-[11px] font-medium text-indigo-100 leading-relaxed opacity-90">ID Empresa: {empresa.id}<br />Factura interna no válida para deducción tributaria oficial.</p>
                    </div>
                </div>
            </div>

            {/* Panel Auditoría */}
            <div className="premium-card !p-0 overflow-hidden shadow-2xl">
                <div className="px-12 py-10 bg-surface-50 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase tracking-[-0.02em]">Historial de Ventas</h2>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1 ml-1">{historicoFacturas.length} transacciones registradas</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="text" placeholder="Buscador..." className="pl-12 pr-6 py-3.5 text-[11px] font-black uppercase tracking-widest border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 transition-all w-64 shadow-sm"
                            value={auditSearch} onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-white border-b border-slate-50 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Folio</th>
                                <th className="px-10 py-6">Fecha</th>
                                <th className="px-10 py-6">Cliente</th>
                                <th className="px-10 py-6 text-right">Monto Total</th>
                                <th className="px-10 py-6 text-center">Estado Fiscal</th>
                                <th className="px-10 py-6 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {(historicoFacturas.filter(f => f.nro_factura?.toLowerCase().includes(auditSearch.toLowerCase()) || f.cliente_nombre?.toLowerCase().includes(auditSearch.toLowerCase()))
                                .slice((auditPage - 1) * AUDIT_PER_PAGE, auditPage * AUDIT_PER_PAGE)).map(factura => (
                                    <tr key={factura.id} className="hover:bg-primary-50/5 transition-all">
                                        <td className="px-10 py-6 font-mono font-black text-slate-900 tracking-tight">#{factura.nro_factura}</td>
                                        <td className="px-10 py-6 text-slate-500">{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                                        <td className="px-10 py-6 font-black text-slate-700 uppercase">{factura.cliente_nombre}</td>
                                        <td className="px-10 py-6 text-right font-black text-slate-900 font-mono">
                                            {factura.moneda_id === 'USD' ? 'U$D' : '$'}{Number(factura.total).toLocaleString()}
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            {factura.afip_cae ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                                    <CheckCircle size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Fiscalizada (CAE: {factura.afip_cae})</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                                                    <RefreshCw size={10} className="animate-spin" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">En Proceso AFIP</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <button onClick={() => descargarPDF(factura.id, factura.nro_factura)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 transition-all"><FileText size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Cliente Rápido */}
            {showQuickClient && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                            <div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nuevo Cliente</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Registro Rápido</p></div>
                            <button onClick={() => setShowQuickClient(false)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleQuickClientSubmit} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <input autoFocus required type="text" placeholder="Nombre Completo" className="w-full bg-surface-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-primary-500 transition-all"
                                    value={quickClientForm.nombre} onChange={e => setQuickClientForm({ ...quickClientForm, nombre: e.target.value })} />
                                <input required type="text" placeholder="CUIT / CUIL / DNI" className="w-full bg-surface-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-primary-500 transition-all"
                                    value={quickClientForm.documento_identidad} onChange={e => setQuickClientForm({ ...quickClientForm, documento_identidad: e.target.value })} />
                            </div>
                            <button type="submit" disabled={createClientMutation.isPending} className="w-full h-16 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all">Registrar Cliente</button>
                        </form>
                    </div>
                </div>
            )}

            {renderInvoiceSummary()}

            {/* Modal MercadoPago QR */}
            {showQRModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="p-10 text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm animate-bounce">
                                    <CreditCard size={40} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Escanea para Pagar</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Paga con la App de Mercado Pago</p>
                            
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 mb-8 relative">
                                {!qrData ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <RefreshCw size={32} className="text-blue-500 animate-spin" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Generando Código...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`} 
                                            alt="MercadoPago QR"
                                            className="w-full max-w-[200px] h-auto rounded-2xl shadow-xl grayscale-[0.2] hover:grayscale-0 transition-all cursor-crosshair"
                                        />
                                        <div className="mt-6 flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Esperando Pago...</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold">Total ARS: ${totalFacturaOriginal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setShowQRModal(false)} className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">
                                Cancelar Operación
                            </button>
                        </div>
                        
                        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
                             <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" className="w-40" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Facturacion;

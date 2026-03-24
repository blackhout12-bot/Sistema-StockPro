import React, { useState, useEffect, useMemo } from 'react';
import { DownloadService } from '../utils/downloadService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { usePOSEngine } from '../utils/posEngine';
import { ShoppingCart, Plus, Trash2, Search, FileText, CheckCircle, Package, User, CreditCard, ArrowRight, RefreshCw, Minus, ChevronDown, Save, X, AlertTriangle, Building2 } from 'lucide-react';
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
    const { token, featureToggles, empresaConfig } = useAuth();
    const { sucursalActiva, depositoActivo } = useBranch();
    const { validateAddToCart, calcTaxes, schema: rubroSchema } = usePOSEngine(empresaConfig?.rubro || 'general');
    const queryClient = useQueryClient();

    // ── Queries (TanStack Query) ─────────────────────────────────
    const { data: clientes = [], isLoading: loadingClientes } = useQuery({
        queryKey: ['clientes'],
        queryFn: async () => { const res = await api.get('/clientes'); return res.data; },
        enabled: !!token
    });

    const { data: productosBrutos = [], isLoading: loadingProductos } = useQuery({
        queryKey: ['productos', depositoActivo?.id],
        queryFn: async () => { 
            const params = {};
            if (depositoActivo?.id) params.deposito_id = depositoActivo.id;
            const res = await api.get('/productos', { params }); 
            return res.data; 
        },
        enabled: !!token
    });

    const productos = useMemo(() => productosBrutos.map(p => ({
        ...p,
        stock: p.stock_deposito !== undefined ? p.stock_deposito : p.stock
    })).filter(p => p.stock > 0), [productosBrutos]);

    const { data: empresa = {}, isLoading: loadingEmpresa } = useQuery({
        queryKey: ['empresa'],
        queryFn: async () => { const res = await api.get('/empresa'); return res.data; },
        enabled: !!token
    });


    const { data: historicoFacturas = [], isLoading: loadingFacturas, refetch: refetchFacturas } = useQuery({
        queryKey: ['historicoFacturas', sucursalActiva?.id],
        queryFn: async () => { 
            const res = await api.get('/facturacion', { params: { sucursal_id: sucursalActiva?.id } }); 
            return res.data; 
        },
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

    // ── Queries para POS_Cajas y POS_Sesiones ────────────────────
    const { data: cajas = [], isLoading: loadingCajas } = useQuery({
        queryKey: ['pos_cajas'],
        queryFn: async () => { const res = await api.get('/pos/cajas'); return res.data; },
        enabled: !!token
    });

    // Guardaremos el ID de caja activamente seleccionado (normalmente el devuelto por la sesión o la primera por defecto)
    const [selectedCaja, setSelectedCaja] = useState('');
    const [montoInicial, setMontoInicial] = useState('');

    const cajasFiltradas = useMemo(() => {
        if (!sucursalActiva || !sucursalActiva.id) return cajas;
        return cajas.filter(c => c.sucursal_id === sucursalActiva.id || !c.sucursal_id);
    }, [cajas, sucursalActiva]);

    const { data: sesionActiva, isLoading: loadingSesion, refetch: refetchSesion } = useQuery({
        // Dependemos del ID de caja si estuviera forzado, pero el backend trae la sesión activa del usuario
        queryKey: ['pos_sesion_activa'],
        queryFn: async () => { const res = await api.get('/pos/sesion/activa'); return res.data; },
        enabled: !!token
    });

    const isSessionOpen = !!sesionActiva;

    // Mutation para ABRIR sesión
    const abrirSesionMutation = useMutation({
        mutationFn: (payload) => api.post('/pos/sesion/abrir', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos_sesion_activa'] });
            toast.success('Turno de caja abierto correctamente. ¡Buena jornada!');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Error al abrir caja');
        }
    });

    const handleAbrirCaja = (e) => {
        e.preventDefault();
        if (!selectedCaja) return toast.error('Debes seleccionar una caja registradora.');
        abrirSesionMutation.mutate({ caja_id: selectedCaja, monto_inicial: parseFloat(montoInicial) || 0 });
    };

    // Auto-select primera caja si no hay sesion
    useEffect(() => {
        if (!isSessionOpen && cajasFiltradas.length > 0 && !selectedCaja) {
            setSelectedCaja(cajasFiltradas[0].id);
        }
        if (sesionActiva) {
            setSelectedCaja(sesionActiva.caja_id);
        }
    }, [cajasFiltradas, isSessionOpen, sesionActiva, selectedCaja]);

    // Mutation para CERRAR sesión
    const cerrarSesionMutation = useMutation({
        mutationFn: (payload) => api.post('/pos/sesion/cerrar', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos_sesion_activa'] });
            toast.success('Turno cerrado exitosamente. El reporte X fue generado.');
            setSelectedCaja('');
            setMontoInicial('');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Error al cerrar caja');
        }
    });

    const handleCerrarCaja = () => {
        if (!sesionActiva) return;
        if (window.confirm('¿Está seguro que desea cerrar el turno de caja actual?')) {
            cerrarSesionMutation.mutate({ sesion_id: sesionActiva.id, monto_cierre: 0 }); // Simplificado para cerrar con 0 por defecto sin modal
        }
    };

    const cargarDatosMaestros = () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        queryClient.invalidateQueries({ queryKey: ['productos'] });
        queryClient.invalidateQueries({ queryKey: ['empresa'] });
        queryClient.invalidateQueries({ queryKey: ['historicoFacturas'] });
    };

    // Estado del POS
    const [clienteId, setClienteId] = useState('0');
    const [carrito, setCarrito] = useState([]);
    const [facturaAnterior, setFacturaAnterior] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagoCon, setPagoCon] = useState('');
    const [vuelto, setVuelto] = useState(0);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [tipoComprobante, setTipoComprobante] = useState('');
    const [monedaId, setMonedaId] = useState('ARS');
    const [origenVenta, setOrigenVenta] = useState('Local');

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
    
    // Extracción Impositiva asumiendo precios finales (factura consumidor / B2C mixta)
    const desgloseImpuestos = useMemo(() => {
        const iva_porcentaje = 21;
        const neto = totalFacturaOriginal / (1 + (iva_porcentaje / 100));
        return {
            subtotal_neto: neto,
            iva: iva_porcentaje,
            iva_monto: totalFacturaOriginal - neto,
            total: totalFacturaOriginal
        };
    }, [totalFacturaOriginal]);

    const totalFactura = useMemo(() => {
        if (monedaId === 'USD') {
            return desgloseImpuestos.total / (cotizaciones.USD || 1050);
        }
        return desgloseImpuestos.total;
    }, [desgloseImpuestos, monedaId, cotizaciones]);

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
        if (clienteId === '') {
            toast.error('Seleccione un Cliente o Consumidor Final primero');
            return;
        }

        // ── Validación contextual del rubro ─────────────────────
        const validation = validateAddToCart(prod);
        if (!validation.valid) {
            if (validation.level === 'error') {
                // Bloqueo duro: no se puede agregar
                toast.error(validation.message, { duration: 5000 });
                return;
            }
            if (validation.level === 'warning' && validation.confirmable) {
                // Advertencia: agrega pero con notificación prominente
                toast(validation.message, {
                    icon: '⚠️',
                    duration: 6000,
                    style: { background: '#fef9c3', color: '#854d0e', fontWeight: 700 }
                });
            }
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
                subtotal: prod.precio,
                custom_fields: prod.custom_fields
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
        mutationFn: (payload) => api.post('/facturacion', { ...payload, caja_id: sesionActiva?.caja_id }),
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
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
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
        if (clienteId === '') {
            toast.error('Debe seleccionar un cliente o Consumidor Final antes de completar la venta');
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
            cliente_id: clienteId === '0' ? null : parseInt(clienteId),
            subtotal: parseFloat(desgloseImpuestos.subtotal_neto.toFixed(2)),
            impuestos: parseFloat(desgloseImpuestos.iva_monto.toFixed(2)),
            total: parseFloat(desgloseImpuestos.total.toFixed(2)),
            detalles: carrito.map(item => ({ ...item, deposito_id: depositoActivo?.id })),
            tipo_comprobante: tipoComprobante,
            metodo_pago: metodoPago,
            moneda_id: monedaId,
            sucursal_id: sucursalActiva?.id,
            tipo_cambio: monedaId === 'USD' ? (cotizaciones.USD || 1050) : 1,
            external_reference: externalRef, // Vincular con el pago si existe
            origen_venta: origenVenta
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md overflow-y-auto py-12 px-4 animate-in fade-in duration-300">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .invoice-print-root, .invoice-print-root * { visibility: visible; }
                        .invoice-print-root { 
                            position: absolute; 
                            left: 0; 
                            top: 0;
                            width: 100%; 
                            background: white;
                            padding: 0;
                            margin: 0;
                            border-radius: 0 !important;
                            box-shadow: none !important;
                        }
                        .no-print { display: none !important; }
                    }
                `}} />
                
                {/* 💳 Premium Receipt Card */}
                <div className="invoice-print-root bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-500 relative border border-slate-100/50">
                    
                    {/* Header Strip */}
                    <div className="h-2 w-full bg-primary-600"></div>

                    {/* Toolbar (Appears only on screen) */}
                    <div className="no-print flex justify-between items-center px-8 py-5 bg-white border-b border-slate-50">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <div className="bg-emerald-50 p-1.5 rounded-full ring-1 ring-emerald-100 ring-inset">
                                <CheckCircle size={14} strokeWidth={3} />
                            </div>
                            <span className="font-extrabold text-[10px] uppercase tracking-[0.15em] mt-0.5">Operación Procesada</span>
                        </div>
                        <button onClick={() => setFacturaAnterior(null)} className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all">
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-10">
                        
                        {/* Company & Folio */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{facturaAnterior.empresa_nombre_snapshot}</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{facturaAnterior.empresa_direccion_snapshot || 'Sede Central'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Folio</p>
                                <p className="text-sm font-black text-slate-800 tracking-tight font-mono">#{facturaAnterior.nro_factura}</p>
                            </div>
                        </div>

                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 rounded-2xl p-5 border border-slate-100/50">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                                <p className="text-[11px] font-black text-slate-700 uppercase truncate">{facturaAnterior.cliente_nombre}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{facturaAnterior.cliente_doc}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                                <p className="text-[11px] font-black text-slate-700 uppercase">{new Date(facturaAnterior.fecha_emision || Date.now()).toLocaleDateString('es-AR')}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">Cajero: {facturaAnterior.vendedor_nombre}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Artículo</th>
                                        <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cant</th>
                                        <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {facturaAnterior.detalles?.map((d, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="py-3 text-[11px] font-bold text-slate-700 uppercase pr-2 group-hover:text-primary-600 transition-colors">{d.producto_nombre || d.nombre}</td>
                                            <td className="py-3 text-[11px] font-black text-slate-400 text-center">x{d.cantidad}</td>
                                            <td className="py-3 text-[12px] font-black text-slate-800 text-right font-mono">${Number(d.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="pt-5 border-t-2 border-slate-100 space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                                <span className="text-xs font-black text-slate-500 font-mono">${Number(facturaAnterior.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impuestos</span>
                                <span className="text-xs font-black text-slate-500 font-mono">${Number(facturaAnterior.impuestos || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center px-1 pt-4 mt-2 border-t border-slate-50">
                                <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Total Cobrado</span>
                                <span className="text-3xl font-black text-primary-600 font-mono tracking-tighter">${Number(facturaAnterior.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                    </div>

                    {/* Action Bar */}
                    <div className="no-print bg-slate-50 border-t border-slate-100 p-6 flex flex-col md:flex-row gap-3 justify-center">
                        <button onClick={() => descargarPDF(facturaAnterior.id, facturaAnterior.nro_factura, true)} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm flex justify-center items-center gap-2">
                            <Search size={14} /> Vista Previa
                        </button>
                        <button onClick={() => descargarPDF(facturaAnterior.id, facturaAnterior.nro_factura)} className="flex-1 py-3.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 flex justify-center items-center gap-2">
                            <FileText size={14} /> PDF
                        </button>
                        <button onClick={() => window.print()} className="flex-1 py-3.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all shadow-md flex justify-center items-center gap-2">
                            <CheckCircle size={14} /> Térmico
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* BLOQUEO DE CAJA POS */}
            {!isLoadingMaestros && !loadingSesion && !isSessionOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 border border-primary-100 mx-auto shadow-inner shadow-primary-500/20 mb-6">
                            <Building2 size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-center text-slate-900 mb-2 tracking-tighter">Apertura de Caja</h2>
                        <p className="text-center text-slate-500 mb-8 text-sm font-medium">Debes abrir tu turno de caja registradora en esta sucursal para centralizar la facturación.</p>
                        
                        <form onSubmit={handleAbrirCaja} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Caja Asignada *</label>
                                <select 
                                    className="w-full bg-surface-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-primary-500/5 outline-none transition-all shadow-sm"
                                    value={selectedCaja}
                                    onChange={(e) => setSelectedCaja(e.target.value)}
                                    required
                                >
                                    <option value="">-- Elige una caja --</option>
                                    {cajasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-widest text-center mt-2">
                                CAJAS VISIBLES PARA SUCURSAL: {sucursalActiva?.nombre || 'Todas'}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Monto Inicial (Fondo de Cambio)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 font-bold">$</div>
                                    <input 
                                        type="number" 
                                        className="w-full bg-surface-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-primary-500/5 outline-none transition-all shadow-sm"
                                        value={montoInicial}
                                        onChange={(e) => setMontoInicial(e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full flex items-center justify-center py-4 bg-primary-600 hover:bg-primary-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-soft active:scale-95 disabled:opacity-50 mt-4"
                            >
                                Iniciar Turno de Venta
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Loading Skeletons for POS */}
            {isLoadingMaestros && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-pulse mt-8">
                     <div className="xl:col-span-8 space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="h-40 bg-surface-50 border border-slate-100 rounded-[2rem]"></div>
                             <div className="h-40 bg-surface-50 border border-slate-100 rounded-[2rem]"></div>
                         </div>
                         <div className="h-[500px] bg-surface-50 border border-slate-100 rounded-[2rem]"></div>
                     </div>
                     <div className="xl:col-span-4 space-y-6">
                         <div className="h-64 bg-surface-50 border border-slate-100 rounded-[2.5rem]"></div>
                         <div className="h-80 bg-surface-50 border border-slate-100 rounded-[2.5rem]"></div>
                     </div>
                </div>
            )}

            {/* Header POS */}
            {!isLoadingMaestros && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-premium">
                        <ShoppingCart size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase tracking-[-0.04em]">Punto de Venta</h1>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.3em] mt-1 ml-1">
                            Facturación · {empresa.nombre} {depositoActivo ? `· Depósito: ${depositoActivo.nombre}` : ''}
                        </p>
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
                        <div className="flex items-center gap-3">
                            <p className="text-xl font-black text-slate-900 font-mono tracking-tighter leading-none">
                                {cajas.find(c => c.id === sesionActiva?.caja_id)?.nombre || 'CAJA ACTIVA'}
                            </p>
                            <button 
                                onClick={handleCerrarCaja}
                                disabled={cerrarSesionMutation.isLoading}
                                className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* Layout Principal */}
            {!isLoadingMaestros && (
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
                                <option value="0">Consumidor Final (CF)</option>
                                <option disabled value="">────────────────────</option>
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
                            <StatDetail label="Subtotal (Neto)" value={`${monedaId === 'USD' ? 'U$D' : '$'} ${(monedaId === 'USD' ? desgloseImpuestos.subtotal_neto / (cotizaciones.USD || 1050) : desgloseImpuestos.subtotal_neto).toLocaleString('es-AR', {minimumFractionDigits: 2})}`} />
                            {desgloseImpuestos.iva > 0 && (
                                <StatDetail label={`IVA (${desgloseImpuestos.iva}%)`} value={`${monedaId === 'USD' ? 'U$D' : '$'} ${(monedaId === 'USD' ? desgloseImpuestos.iva_monto / (cotizaciones.USD || 1050) : desgloseImpuestos.iva_monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}`} color="text-indigo-600" />
                            )}
                            
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
                            {featureToggles?.mod_marketplace && (
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-2">Origen de Venta (E-Commerce)</label>
                                    <div className="flex bg-surface-50 p-1.5 rounded-2xl border border-slate-100 relative">
                                        <button 
                                            onClick={() => setOrigenVenta('Local')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${origenVenta === 'Local' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >Local Físico</button>
                                        <button 
                                            onClick={() => setOrigenVenta('MercadoLibre')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${origenVenta === 'MercadoLibre' ? 'bg-yellow-400 text-yellow-900 shadow-sm border border-yellow-300' : 'text-slate-400 hover:text-slate-600'}`}
                                        >MercadoLibre</button>
                                        <button 
                                            onClick={() => setOrigenVenta('Tienda Online')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${origenVenta === 'Tienda Online' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
                                        >Tienda Online</button>
                                    </div>
                                </div>
                            )}
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
            )}

            {/* Panel Auditoría */}
            {!isLoadingMaestros && (
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
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-slate-900 tracking-tight">#{factura.nro_factura}</span>
                                                {factura.origen_venta === 'MercadoLibre' && <span className="text-[8px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 font-black rounded uppercase tracking-wider">MELI</span>}
                                                {factura.origen_venta === 'Tienda Online' && <span className="text-[8px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 font-black rounded uppercase tracking-wider">WEB</span>}
                                            </div>
                                        </td>
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
            )}

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

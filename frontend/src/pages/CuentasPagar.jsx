import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { Search, Eye, DollarSign, RefreshCw, AlertCircle, CreditCard, ChevronRight, CheckCircle, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CuentasPagar = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showPayModal, setShowPayModal] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(null);

    // ─── Queries ─────────────────────────────────────────
    const { data: cuentas = [], isLoading, error, refetch } = useQuery({
        queryKey: ['cuentas-pagar'],
        queryFn: async () => {
            const res = await api.get('/cuentas-pagar');
            return res.data;
        }
    });

    const filteredCuentas = cuentas.filter(c => 
        (c.proveedor_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Kpis
    const totalDeuda = cuentas.reduce((acc, c) => acc + (c.estado !== 'PAGADA' ? c.saldo : 0), 0);
    const totalVencidas = cuentas.filter(c => new Date(c.fecha_vencimiento) < new Date() && c.estado !== 'PAGADA').length;

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Cuentas por Pagar</h1>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                        Control de Deudas a Proveedores
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="premium-card !p-6 flex items-center gap-5 bg-gradient-to-br from-rose-50 to-white border-rose-100">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <DollarSign size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Deuda Total Activa</p>
                        <h2 className="text-3xl font-black text-rose-950">${totalDeuda.toLocaleString('es-AR')}</h2>
                    </div>
                </div>
                <div className="premium-card !p-6 flex items-center gap-5 bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertCircle size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Facturas Vencidas</p>
                        <h2 className="text-3xl font-black text-amber-950">{totalVencidas} <span className="text-sm text-amber-600 font-bold">pendientes</span></h2>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="premium-card !p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de proveedor..."
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
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculando saldos...</p>
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
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4">Deuda Original</th>
                                <th className="px-6 py-4">Pagado</th>
                                <th className="px-6 py-4 text-right">Saldo Pendiente</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCuentas.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{cuenta.proveedor_nombre}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">${Number(cuenta.monto_adeudado).toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 font-mono text-emerald-600">${Number(cuenta.monto_pagado).toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-rose-600">${Number(cuenta.saldo).toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                            cuenta.estado === 'PAGADA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            cuenta.estado === 'PARCIAL' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            {cuenta.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {cuenta.estado !== 'PAGADA' && (
                                                <button onClick={() => setShowPayModal(cuenta)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-base text-white hover:bg-brand-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm">
                                                    <CreditCard size={12}/> Abonar
                                                </button>
                                            )}
                                            <button onClick={() => setShowDetailModal(cuenta)} className="p-1.5 border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-300 rounded-lg transition-all">
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCuentas.length === 0 && (
                                <tr><td colSpan="6" className="py-16 text-center text-slate-400 font-bold">No existen deudas registradas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showPayModal && (
                <PagoModal cuenta={showPayModal} onClose={() => setShowPayModal(null)} />
            )}

            {showDetailModal && (
                <DetailModal cuentaId={showDetailModal.id} onClose={() => setShowDetailModal(null)} />
            )}
        </div>
    );
};

const PagoModal = ({ cuenta, onClose }) => {
    const queryClient = useQueryClient();
    const [monto, setMonto] = useState(cuenta.saldo);
    const [metodo, setMetodo] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');

    const pagoMutation = useMutation({
        mutationFn: (data) => api.post('/cuentas-pagar/pago', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['cuentas-pagar']);
            toast.success('Pago registrado exitosamente');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al registrar pago')
    });

    const submit = (e) => {
        e.preventDefault();
        if(monto <= 0 || monto > cuenta.saldo) return toast.error('Monto inválido. Debe ser mayor a 0 y menor o igual al saldo pendiente.');
        pagoMutation.mutate({ cuenta_pagar_id: cuenta.id, monto_pagado: Number(monto), metodo_pago: metodo, referencia });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 bg-brand-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black tracking-tighter">Registrar Pago</h3>
                        <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest mt-1">A Proveedor</p>
                    </div>
                </div>
                <form onSubmit={submit} className="p-8 space-y-5">
                    <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl mb-6">
                        <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest mb-1">Saldo a Pagar</p>
                        <p className="text-2xl font-black text-brand-950 font-mono">${Number(cuenta.saldo).toLocaleString('es-AR')}</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Monto a Abonar ($)</label>
                        <input required type="number" step="0.01" max={cuenta.saldo} className="w-full bg-surface-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-black outline-none focus:ring-2 focus:ring-brand-500" value={monto} onChange={e => setMonto(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Método de Pago</label>
                        <select className="w-full bg-surface-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={metodo} onChange={e => setMetodo(e.target.value)}>
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Referencia / OP Opcional</label>
                        <input type="text" placeholder="Ej: OP-00123" className="w-full bg-surface-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500" value={referencia} onChange={e => setReferencia(e.target.value)} />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={pagoMutation.isPending} className="flex-[2] py-3 bg-brand-base text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-500 shadow-soft disabled:opacity-50">
                            {pagoMutation.isPending ? 'Confirmando...' : 'Confirmar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DetailModal = ({ cuentaId, onClose }) => {
    const { data: cuenta, isLoading } = useQuery({
        queryKey: ['cuenta', cuentaId],
        queryFn: async () => {
             const res = await api.get(`/cuentas-pagar/${cuentaId}`);
             return res.data;
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Historial de Pagos</h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Cuenta #{cuentaId}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 shadow-sm"><X size={16} /></button>
                </div>
                
                <div className="p-8">
                    {isLoading || !cuenta ? (
                        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deuda Total</p> <p className="text-lg font-black text-slate-800 font-mono">${Number(cuenta.monto_adeudado).toLocaleString('es-AR')}</p></div>
                                <div className="border-x border-slate-200"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pagado</p> <p className="text-lg font-black text-emerald-600 font-mono">${Number(cuenta.monto_pagado).toLocaleString('es-AR')}</p></div>
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Actual</p> <p className="text-lg font-black text-rose-600 font-mono">${Number(cuenta.saldo).toLocaleString('es-AR')}</p></div>
                            </div>

                            <div>
                                <h4 className="text-[10px] flex items-center gap-1.5 font-black text-slate-400 uppercase tracking-widest mb-3"><FileText size={12}/> Recibos y Abonos Emulados</h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                     <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                                            <tr>
                                                <th className="px-4 py-2">Fecha</th>
                                                <th className="px-4 py-2">Método</th>
                                                <th className="px-4 py-2">Ref / OP</th>
                                                <th className="px-4 py-2 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {cuenta.pagos?.map(d => (
                                                <tr key={d.id}>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{new Date(d.fecha_pago).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-600">{d.metodo_pago}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{d.referencia || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono font-black text-emerald-600">${Number(d.monto_pagado).toLocaleString('es-AR')}</td>
                                                </tr>
                                            ))}
                                            {(!cuenta.pagos || cuenta.pagos.length === 0) && (
                                                <tr><td colSpan="4" className="py-6 text-center text-xs text-slate-400 font-bold">No se han registrado pagos.</td></tr>
                                            )}
                                        </tbody>
                                     </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CuentasPagar;

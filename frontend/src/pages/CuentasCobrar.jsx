import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { Search, Eye, DollarSign, RefreshCw, AlertCircle, CreditCard, CheckCircle, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CuentasCobrar = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showPayModal, setShowPayModal] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(null);

    // ─── Queries ─────────────────────────────────────────
    const { data: cuentas = [], isLoading, error, refetch } = useQuery({
        queryKey: ['cuentas-cobrar'],
        queryFn: async () => {
            const res = await api.get('/cuentas-cobrar');
            return res.data;
        }
    });

    const filteredCuentas = cuentas.filter(c => 
        (c.cliente_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nro_factura || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Kpis
    const totalPorCobrar = cuentas.reduce((acc, c) => acc + (c.estado !== 'COBRADA' ? c.saldo : 0), 0);
    const totalVencidas = cuentas.filter(c => new Date(c.fecha_vencimiento) < new Date() && c.estado !== 'COBRADA').length;

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Cuentas por Cobrar</h1>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                        Control de Deudas de Clientes
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="premium-card !p-6 flex items-center gap-5 bg-gradient-to-br from-sky-50 to-white border-sky-100">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <DollarSign size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Capital por Cobrar Activo</p>
                        <h2 className="text-3xl font-black text-sky-950">${totalPorCobrar.toLocaleString('es-AR')}</h2>
                    </div>
                </div>
                <div className="premium-card !p-6 flex items-center gap-5 bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertCircle size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Facturas Vencidas</p>
                        <h2 className="text-3xl font-black text-amber-950">{totalVencidas} <span className="text-sm text-amber-600 font-bold">atrasadas</span></h2>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="premium-card !p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de cliente o nro de factura..."
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
                                <th className="px-6 py-4">Cliente / Factura</th>
                                <th className="px-6 py-4">Deuda Original</th>
                                <th className="px-6 py-4">Cobrado</th>
                                <th className="px-6 py-4 text-right">Saldo a Favor</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCuentas.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{cuenta.cliente_nombre}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase font-mono mt-0.5">{cuenta.nro_factura || 'Deuda Histórica'}</p>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-500">${Number(cuenta.monto_adeudado).toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 font-mono text-emerald-600">${Number(cuenta.monto_cobrado).toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-sky-600">${Number(cuenta.saldo).toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                            cuenta.estado === 'COBRADA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            cuenta.estado === 'PARCIAL' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            {cuenta.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {cuenta.estado !== 'COBRADA' && (
                                                <button onClick={() => setShowPayModal(cuenta)} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white hover:bg-sky-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm">
                                                    <CreditCard size={12}/> Cobrar
                                                </button>
                                            )}
                                            <button onClick={() => setShowDetailModal(cuenta)} className="p-1.5 border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-300 rounded-lg transition-all">
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCuentas.length === 0 && (
                                <tr><td colSpan="6" className="py-16 text-center text-slate-400 font-bold">No existen cuentas por cobrar registradas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showPayModal && (
                <CobroModal cuenta={showPayModal} onClose={() => setShowPayModal(null)} />
            )}

            {showDetailModal && (
                <DetailModal cuentaId={showDetailModal.id} onClose={() => setShowDetailModal(null)} />
            )}
        </div>
    );
};

const CobroModal = ({ cuenta, onClose }) => {
    const queryClient = useQueryClient();
    const [monto, setMonto] = useState(cuenta.saldo);
    const [metodo, setMetodo] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');

    const cobroMutation = useMutation({
        mutationFn: (data) => api.post('/cuentas-cobrar/cobro', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['cuentas-cobrar']);
            toast.success('Cobro registrado exitosamente');
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error al registrar cobro')
    });

    const submit = (e) => {
        e.preventDefault();
        if(monto <= 0 || monto > cuenta.saldo) return toast.error('Monto inválido. Debe ser mayor a 0 y menor o igual al saldo pendiente.');
        cobroMutation.mutate({ cuenta_cobrar_id: cuenta.id, monto_cobrado: Number(monto), metodo_pago: metodo, referencia });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 bg-sky-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black tracking-tighter">Registrar Ingreso</h3>
                        <p className="text-[10px] font-bold text-sky-200 uppercase tracking-widest mt-1">Cobro de Cliente</p>
                    </div>
                </div>
                <form onSubmit={submit} className="p-8 space-y-5">
                    <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl mb-6">
                        <p className="text-[10px] text-sky-600 font-black uppercase tracking-widest mb-1">Capital Pendiente</p>
                        <p className="text-2xl font-black text-sky-950 font-mono">${Number(cuenta.saldo).toLocaleString('es-AR')}</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Monto a Cobrar ($)</label>
                        <input required type="number" step="0.01" max={cuenta.saldo} className="w-full bg-surface-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-black outline-none focus:ring-2 focus:ring-sky-500" value={monto} onChange={e => setMonto(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Método de Cobro</label>
                        <select className="w-full bg-surface-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" value={metodo} onChange={e => setMetodo(e.target.value)}>
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta Credito/Debito</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Comprobante / Recibo Opcional</label>
                        <input type="text" placeholder="Ej: REC-00123" className="w-full bg-surface-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" value={referencia} onChange={e => setReferencia(e.target.value)} />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={cobroMutation.isPending} className="flex-[2] py-3 bg-sky-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-sky-500 shadow-soft disabled:opacity-50">
                            {cobroMutation.isPending ? 'Confirmando...' : 'Realizar Cobro'}
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
             const res = await api.get(`/cuentas-cobrar/${cuentaId}`);
             return res.data;
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="px-8 py-6 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Historial de Cobros</h3>
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
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Facturado Total</p> <p className="text-lg font-black text-slate-800 font-mono">${Number(cuenta.monto_adeudado).toLocaleString('es-AR')}</p></div>
                                <div className="border-x border-slate-200"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cobrado Real</p> <p className="text-lg font-black text-emerald-600 font-mono">${Number(cuenta.monto_cobrado).toLocaleString('es-AR')}</p></div>
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pendiente</p> <p className="text-lg font-black text-sky-600 font-mono">${Number(cuenta.saldo).toLocaleString('es-AR')}</p></div>
                            </div>

                            <div>
                                <h4 className="text-[10px] flex items-center gap-1.5 font-black text-slate-400 uppercase tracking-widest mb-3"><FileText size={12}/> Recibos Emitidos</h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                     <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-black text-slate-400 tracking-widest">
                                            <tr>
                                                <th className="px-4 py-2">Fecha</th>
                                                <th className="px-4 py-2">Método</th>
                                                <th className="px-4 py-2">Recibo</th>
                                                <th className="px-4 py-2 text-right">Monto Cobrado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {cuenta.cobros?.map(d => (
                                                <tr key={d.id}>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{new Date(d.fecha_cobro).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-600">{d.metodo_pago}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{d.referencia || '-'}</td>
                                                    <td className="px-4 py-3 text-right text-xs font-mono font-black text-emerald-600">${Number(d.monto_cobrado).toLocaleString('es-AR')}</td>
                                                </tr>
                                            ))}
                                            {(!cuenta.cobros || cuenta.cobros.length === 0) && (
                                                <tr><td colSpan="4" className="py-6 text-center text-xs text-slate-400 font-bold">No se han registrado cobros.</td></tr>
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

export default CuentasCobrar;

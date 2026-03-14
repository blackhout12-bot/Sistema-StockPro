import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Users as CustomersIcon, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, UploadCloud, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Clientes = () => {
    const { token } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        documento_identidad: '',
        email: '',
        telefono: '',
        direccion: ''
    });

    useEffect(() => {
        if (token) {
            fetchClientes();
        }
    }, [token]);

    const fetchClientes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clientes');
            setClientes(res.data);
        } catch (err) {
            toast.error('Error al cargar la cartera de clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cliente = null) => {
        if (cliente) {
            setEditingCliente(cliente);
            setFormData({
                nombre: cliente.nombre,
                documento_identidad: cliente.documento_identidad,
                email: cliente.email || '',
                telefono: cliente.telefono || '',
                direccion: cliente.direccion || ''
            });
        } else {
            setEditingCliente(null);
            setFormData({ nombre: '', documento_identidad: '', email: '', telefono: '', direccion: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await api.put(`/clientes/${editingCliente.id}`, formData);
                toast.success('Cliente actualizado exitosamente');
            } else {
                await api.post('/clientes', formData);
                toast.success('Cliente registrado exitosamente');
            }
            setShowModal(false);
            fetchClientes();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al guardar cliente');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
        try {
            await api.delete(`/clientes/${id}`);
            toast.success('Cliente eliminado');
            fetchClientes();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al eliminar cliente');
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return toast.error('Seleccione un archivo CSV');
        
        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await api.post('/importacion/clientes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Importación exitosa. ${res.data.creados} agregados, ${res.data.actualizados} actualizados.`);
            setShowImportModal(false);
            setImportFile(null);
            fetchClientes();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error importando archivo');
        } finally {
            setImporting(false);
        }
    };

    const filteredClientes = clientes.filter(c => {
        const term = searchTerm.toLowerCase();
        return (c.nombre && String(c.nombre).toLowerCase().includes(term)) ||
            (c.documento_identidad && String(c.documento_identidad).includes(searchTerm));
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <CustomersIcon className="text-primary-600" size={32} />
                        Cartera de Clientes
                    </h1>
                    {!loading && (
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1 ml-11">
                            CRM Activo · {clientes.length} Contactos Registrados
                        </p>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <UploadCloud size={16} />
                        Importar CSV
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-95"
                    >
                        <Plus size={16} />
                        Vincular Cliente
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="premium-card !p-5 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o referencia..."
                        className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Listado de Clientes Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Directorio...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClientes.map(cliente => (
                        <div key={cliente.id} className="premium-card group hover:border-primary-100 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase group-hover:text-primary-600 transition-colors leading-tight">
                                        {cliente.nombre}
                                    </h3>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black bg-surface-50 text-slate-500 border border-slate-100 mt-2 uppercase tracking-tighter">
                                        CUIT / DNI: {cliente.documento_identidad}
                                    </span>
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleOpenModal(cliente)}
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                        title="Editar"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cliente.id)}
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cliente.email && (
                                    <div className="flex items-center group/item hover:bg-surface-50 p-2 -mx-2 rounded-xl transition-all">
                                        <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-500 mr-3">
                                            <Mail size={12} />
                                        </div>
                                        <a href={`mailto:${cliente.email}`} className="text-xs font-bold text-slate-500 hover:text-primary-600 truncate">{cliente.email}</a>
                                    </div>
                                )}
                                {cliente.telefono && (
                                    <div className="flex items-center group/item hover:bg-surface-50 p-2 -mx-2 rounded-xl transition-all">
                                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 mr-3">
                                            <Phone size={12} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{cliente.telefono}</span>
                                    </div>
                                )}
                                {cliente.direccion && (
                                    <div className="flex items-start group/item hover:bg-surface-50 p-2 -mx-2 rounded-xl transition-all">
                                        <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 mr-3 shrink-0">
                                            <MapPin size={12} />
                                        </div>
                                        <span className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-2">{cliente.direccion}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredClientes.length === 0 && (
                        <div className="col-span-full premium-card flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-16 h-16 bg-surface-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100">
                                <CustomersIcon size={32} strokeWidth={1.5} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No se encontraron registros</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Crear/Editar Cliente */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-10 py-8 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                                    {editingCliente ? 'Actualizar Cliente' : 'Nuevo Registro de Cliente'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Información Comercial y de Contacto
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
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Razón Social / Nombre *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:font-medium"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Ej: Juan Pérez o Empresa S.A."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">CUIT / DNI *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono"
                                                value={formData.documento_identidad}
                                                onChange={(e) => setFormData({ ...formData, documento_identidad: e.target.value })}
                                                placeholder="000.000.000-0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Línea de Contacto</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                                placeholder="+00 000 0000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="cliente@ejemplo.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dirección de Entrega / Fiscal</label>
                                        <textarea
                                            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all min-h-[80px]"
                                            rows="2"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            placeholder="Calle, Número, Ciudad..."
                                        ></textarea>
                                    </div>
                                </div>
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
                                        {editingCliente ? 'Sincronizar Cambios' : 'Confirmar Registro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Importación CSV */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-8 py-6 bg-surface-50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                                    Subir Cartera de Clientes
                                </h3>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                                    Formato CSV / Excel
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowImportModal(false); setImportFile(null); }}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleImportSubmit} className="p-8">
                            <div className="mb-6">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Archivo de Origen</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    className="block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-xl file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100 cursor-pointer"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-3 font-medium">
                                    Formato esperado: <code className="bg-slate-50 text-slate-600 px-1 py-0.5 rounded">documento_identidad,nombre,tipo_documento,email,telefono,direccion</code>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowImportModal(false); setImportFile(null); }}
                                    className="flex-1 px-6 py-3 bg-surface-50 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing || !importFile}
                                    className="flex-1 flex justify-center items-center gap-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-soft active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {importing ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                    {importing ? 'Procesando...' : 'Subir Archivo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;

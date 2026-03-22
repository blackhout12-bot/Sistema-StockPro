import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';
import {
    Building2, Search, Plus, Edit2, Trash2, MapPin, Phone,
    CheckCircle2, XCircle, AlertCircle, X, ShieldAlert
} from 'lucide-react';

const Sucursales = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSucursal, setEditingSucursal] = useState(null);
    const [deletingSucursal, setDeletingSucursal] = useState(null);

    // Queries
    const { data: sucursales, isLoading, error } = useQuery({
        queryKey: ['sucursales'],
        queryFn: async () => {
            const { data } = await api.get('/sucursales');
            return data;
        }
    });

    // Mutations
    const mutationCreate = useMutation({
        mutationFn: (newSucursal) => api.post('/sucursales', newSucursal),
        onSuccess: () => {
            queryClient.invalidateQueries(['sucursales']);
            toast.success('Sucursal creada exitosamente. Se ha generado su Caja POS y Depósito por defecto.');
            handleCloseModal();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error creando sucursal')
    });

    const mutationUpdate = useMutation({
        mutationFn: ({ id, data }) => api.put(`/sucursales/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['sucursales']);
            toast.success('Sucursal actualizada exitosamente');
            handleCloseModal();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error actualizando sucursal')
    });

    const mutationDelete = useMutation({
        mutationFn: (id) => api.delete(`/sucursales/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['sucursales']);
            toast.success('Sucursal eliminada o desactivada preventivamente.');
            setDeletingSucursal(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'La sucursal tiene inventario u operaciones asociadas y no puede eliminarse.')
    });

    // Handlers
    const handleOpenModal = (sucursal = null) => {
        setEditingSucursal(sucursal);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setEditingSucursal(null), 200);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            nombre: formData.get('nombre'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            activa: formData.get('activa') === 'true'
        };

        if (editingSucursal) {
            mutationUpdate.mutate({ id: editingSucursal.id, data: payload });
        } else {
            mutationCreate.mutate(payload);
        }
    };

    const filteredData = sucursales?.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200 m-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800">Error al cargar sucursales</h3>
            <p className="text-red-600">{error.message}</p>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-indigo-600" />
                        Red de Sucursales
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Administra múltiples tiendas físicas, sus cajas POS y depósitos de forma centralizada.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-indigo-200 transition-all active:scale-95 text-sm"
                    >
                        <Plus className="w-4 h-4 text-indigo-100" />
                        Nueva Sucursal
                    </button>
                </div>
            </div>

            {/* Contenedor Principal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o dirección..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                <th className="px-6 py-4">Sucursal</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Teléfono</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-5">
                                            <div className="h-5 bg-gray-100 rounded-md w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredData?.length > 0 ? (
                                filteredData.map((suc) => (
                                    <tr key={suc.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{suc.nombre}</p>
                                                    <p className="text-xs text-gray-400 font-medium tracking-wide">ID: SUC-{String(suc.id).padStart(3, '0')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {suc.direccion || <span className="text-gray-300 italic">Sin dirección</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {suc.telefono || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${suc.activa ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {suc.activa ? <><CheckCircle2 className="w-3.5 h-3.5" /> Activa</> : <><XCircle className="w-3.5 h-3.5" /> Inactiva</>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(suc)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingSucursal(suc)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Building2 className="w-12 h-12 mb-3 text-gray-200" />
                                            <p className="text-sm font-medium text-gray-500">No se encontraron sucursales.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la Sucursal <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="nombre"
                                    defaultValue={editingSucursal?.nombre}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                    placeholder="Ej. Casa Central o Sucursal Belgrano"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    defaultValue={editingSucursal?.direccion}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                    placeholder="Calle 123, Ciudad"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    defaultValue={editingSucursal?.telefono}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                    placeholder="+54 11 1234 5678"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado Operativo</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/50 px-4 py-3 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors flex-1">
                                        <input type="radio" name="activa" value="true" defaultChecked={editingSucursal ? editingSucursal.activa : true} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                                        <span className="text-sm font-semibold text-emerald-900">Activa</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-red-50/50 px-4 py-3 rounded-xl border border-red-100 hover:bg-red-50 transition-colors flex-1">
                                        <input type="radio" name="activa" value="false" defaultChecked={editingSucursal ? !editingSucursal.activa : false} className="text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer" />
                                        <span className="text-sm font-semibold text-red-900">Inactiva</span>
                                    </label>
                                </div>
                            </div>

                            {!editingSucursal && (
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-100 mt-2">
                                    <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-xs font-medium leading-relaxed">
                                        Se generará automáticamente un <strong>Depósito Físico</strong> y una <strong>Caja POS</strong> vinculados a este nuevo punto de venta.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutationCreate.isPending || mutationUpdate.isPending}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center justify-center min-w-[120px]"
                                >
                                    {(mutationCreate.isPending || mutationUpdate.isPending) ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Guardar Sucursal'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            {deletingSucursal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">¿Cerrar {deletingSucursal.nombre}?</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                            Esta acción desactivará las operaciones, la caja y el depósito asociado a esta sucursal.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeletingSucursal(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">
                                Cancelar
                            </button>
                            <button
                                onClick={() => mutationDelete.mutate(deletingSucursal.id)}
                                disabled={mutationDelete.isPending}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm shadow-red-200 transition-all w-full flex justify-center items-center"
                            >
                                {mutationDelete.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Baja'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sucursales;

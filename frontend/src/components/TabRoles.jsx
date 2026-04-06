import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { Shield, Plus, Check, X as XIcon, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MODULOS_MATRIX = ['productos', 'inventario', 'pedidos', 'ventas', 'clientes', 'proveedores', 'reportes', 'empresa', 'dashboard'];
const ACCIONES = ['leer', 'crear', 'actualizar', 'eliminar', 'exportar'];

export default function TabRoles() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form state
    const [editId, setEditId] = useState(null);
    const [nombre, setNombre] = useState('');
    const [codigoRol, setCodigoRol] = useState('');
    const [permisos, setPermisos] = useState({});
    const [esSistema, setEsSistema] = useState(false);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const r = await api.get('/empresa/roles');
            setRoles(r.data);
        } catch (e) {
            toast.error('Error cargando roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRoles(); }, []);

    const handleEdit = (rol) => {
        setEditId(rol.id);
        setNombre(rol.nombre);
        setCodigoRol(rol.codigo_rol);
        setPermisos(JSON.parse(rol.permisos || '{}'));
        setEsSistema(rol.es_sistema);
        setIsEditing(true);
    };

    const handleNew = () => {
        setEditId(null);
        setNombre('');
        setCodigoRol('');
        setPermisos({});
        setEsSistema(false);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!nombre || (!codigoRol && !editId)) {
            return toast.error('Nombre y código son requeridos');
        }
        try {
            const payload = { nombre, codigo_rol: codigoRol || undefined, permisos };
            if (editId) {
                await api.put(`/empresa/roles/${editId}`, payload);
                toast.success('Rol actualizado');
            } else {
                await api.post('/roles/create', payload);
                toast.success('Rol creado');
            }
            setIsEditing(false);
            loadRoles();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error guardando rol');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro de eliminar este rol?')) return;
        try {
            await api.delete(`/empresa/roles/${id}`);
            toast.success('Rol eliminado');
            loadRoles();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Error eliminando rol');
        }
    };

    const togglePermiso = (modulo, accion) => {
        setPermisos(prev => {
            const next = { ...prev };
            if (!next[modulo]) next[modulo] = [];
            
            if (next[modulo].includes(accion)) {
                next[modulo] = next[modulo].filter(a => a !== accion);
            } else {
                next[modulo] = [...next[modulo], accion];
            }
            return next;
        });
    };

    const hasAccess = (rolData, modulo, accion) => {
        try {
            const p = typeof rolData.permisos === 'string' ? JSON.parse(rolData.permisos) : rolData.permisos;
            if (p['*']?.includes(accion) || p['*']?.includes('crear')) return true; // simplified * check
            return p[modulo]?.includes(accion);
        } catch { return false; }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando roles...</div>;

    if (isEditing) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield size={24} className="text-indigo-500" />
                            {editId ? 'Editar Rol' : 'Nuevo Rol'}
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">Guardar</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nombre Visible *</label>
                        <input value={nombre} onChange={e => setNombre(e.target.value)} disabled={esSistema} className="w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Vendedor Sr" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Código Interno *</label>
                        <input value={codigoRol} onChange={e => setCodigoRol(e.target.value)} disabled={esSistema || editId} className="w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="Ej: vendedor_sr" />
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-left">Módulo</th>
                                {ACCIONES.map(a => <th key={a} className="p-3 text-center uppercase text-[10px]">{a}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {MODULOS_MATRIX.map(mod => (
                                <tr key={mod} className="hover:bg-slate-50">
                                    <td className="p-3 font-bold capitalize text-slate-700">{mod}</td>
                                    {ACCIONES.map(acc => {
                                        const checked = permisos[mod]?.includes(acc) || permisos['*']?.includes(acc);
                                        return (
                                            <td key={acc} className="p-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={checked}
                                                    onChange={() => togglePermiso(mod, acc)}
                                                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Shield size={18} className="text-indigo-500" />
                        Roles Dinámicos y Permisos
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Define qué módulos y acciones puede usar cada rol en esta empresa.</p>
                </div>
                <button onClick={handleNew} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <Plus size={16} /> Crear Rol
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-3 text-left font-black text-slate-500 uppercase tracking-widest text-[10px] w-28">Módulo / Rol</th>
                            {roles.map(rol => (
                                <th key={rol.id} className="px-3 py-3 text-center">
                                    <div className="font-black text-slate-800 uppercase tracking-widest text-[10px] whitespace-nowrap">{rol.nombre}</div>
                                    <div className="flex justify-center gap-2 mt-2">
                                        <button onClick={() => handleEdit(rol)} className="text-indigo-500 hover:text-indigo-700"><Edit size={12} /></button>
                                        {!rol.es_sistema && (
                                            <button onClick={() => handleDelete(rol.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={12} /></button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {MODULOS_MATRIX.map(modulo => (
                            ACCIONES.map((accion, ai) => (
                                <tr key={`${modulo}-${accion}`} className={`hover:bg-slate-50/50 transition-colors ${ai === 0 ? 'border-t-2 border-slate-100' : ''}`}>
                                    <td className="px-4 py-2">
                                        {ai === 0 && <span className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{modulo}</span>}
                                        <span className="text-slate-400 text-[9px] block mt-0.5 ml-0.5">{accion}</span>
                                    </td>
                                    {roles.map(rol => (
                                        <td key={rol.id} className="px-3 py-2 text-center">
                                            {hasAccess(rol, modulo, accion)
                                                ? <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 rounded-full"><Check size={10} className="text-emerald-600" /></span>
                                                : <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-50 rounded-full"><XIcon size={9} className="text-slate-300" /></span>
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

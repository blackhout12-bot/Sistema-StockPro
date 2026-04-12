import React, { useState, useMemo } from 'react';
import { 
  User, 
  Trash2, 
  CheckSquare, 
  Square,
  Search,
  ShieldCheck,
  Mail
} from 'lucide-react';

const UsuarioTable = ({ usuarios, onDeleteSelected, updating }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsuarios = useMemo(() => {
    return (usuarios || []).filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usuarios, searchTerm]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsuarios.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsuarios.map(u => u.id));
    }
  };

  const handleDelete = () => {
    onDeleteSelected(selectedIds);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar usuarios..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDelete}
              disabled={updating}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-8 py-5 w-20">
                <button 
                  onClick={handleSelectAll}
                  className="p-2.5 rounded-xl border-2 transition-all bg-white border-slate-200 text-slate-300 hover:border-indigo-200"
                >
                  {selectedIds.length === filteredUsuarios.length && filteredUsuarios.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-transparent">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsuarios.map(usuario => (
              <tr 
                key={usuario.id} 
                className={`group transition-colors ${selectedIds.includes(usuario.id) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
              >
                <td className="px-8 py-5">
                  <button 
                    onClick={() => toggleSelection(usuario.id)}
                    className={`p-2.5 rounded-xl border-2 transition-all ${selectedIds.includes(usuario.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-200'}`}
                  >
                    {selectedIds.includes(usuario.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                      <User className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 leading-none mb-1 text-sm">{usuario.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold italic">
                        <Mail className="w-3 h-3" />
                        {usuario.nombre || 'Sin nombre'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-indigo-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-600">{usuario.rol}</span>
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => onDeleteSelected([usuario.id])}
                      className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-600 border border-slate-200 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </td>
              </tr>
            ))}
            {filteredUsuarios.length === 0 && (
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center">
                   <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No se encontraron usuarios</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsuarioTable;

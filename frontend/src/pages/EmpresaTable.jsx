import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Trash2, 
  CheckSquare, 
  Square,
  Search,
  LayoutGrid,
  Filter
} from 'lucide-react';

const EmpresaTable = ({ empresas, onDeleteSelected, updating, onChangePlan }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmpresas = useMemo(() => {
    return empresas.filter(e => 
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.documento_identidad?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [empresas, searchTerm]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmpresas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmpresas.map(e => e.id));
    }
  };

  const handleDelete = () => {
    onDeleteSelected(selectedIds);
    // Nota: El componente padre debería limpiar la selección si el borrado fue exitoso
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar empresas..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
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
                  {selectedIds.length === filteredEmpresas.length && filteredEmpresas.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actual</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmpresas.map(empresa => (
              <tr 
                key={empresa.id} 
                className={`group transition-colors ${selectedIds.includes(empresa.id) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
              >
                <td className="px-8 py-5">
                  <button 
                    onClick={() => toggleSelection(empresa.id)}
                    className={`p-2.5 rounded-xl border-2 transition-all ${selectedIds.includes(empresa.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-200'}`}
                  >
                    {selectedIds.includes(empresa.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                      <Building2 className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 leading-none mb-1">{empresa.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{empresa.documento_identidad}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col gap-1">
                     <select 
                       value={empresa.plan_id || ''} 
                       onChange={(e) => {
                         if(onChangePlan) onChangePlan(empresa.id, parseInt(e.target.value));
                       }}
                       disabled={updating}
                       className="text-sm font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 rounded-lg py-1 px-2 outline-none cursor-pointer hover:border-indigo-300 transition-colors disabled:opacity-50 appearance-none"
                     >
                       <option value="1">Retail Básico</option>
                       <option value="2">Estándar Pro</option>
                       <option value="3">Full Enterprise</option>
                     </select>
                     {empresa.planDescripcion && <span className="text-[10px] text-slate-400 italic max-w-xs truncate">{empresa.planDescripcion}</span>}
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onDeleteSelected([empresa.id])}
                      title="Eliminar empresa"
                      className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-600 border border-slate-200 transition-all group-hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEmpresas.length === 0 && (
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center">
                   <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No se encontraron empresas con esos criterios</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmpresaTable;

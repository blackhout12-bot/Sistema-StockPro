import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Trash2, 
  CheckCircle2, 
  Search,
  LayoutGrid,
  Filter,
  AlertCircle
} from 'lucide-react';

const planesDisponibles = [
  { id: 1, nombre: 'Retail Básico' },
  { id: 2, nombre: 'Estándar Pro' },
  { id: 3, nombre: 'Full Enterprise' }
];

const EmpresaCards = ({ empresas, onDeleteSelected, updating, onChangePlan }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmpresas = useMemo(() => {
    return empresas.filter(e => 
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.documento_identidad?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [empresas, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar empresas..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredEmpresas.map(empresa => (
          <div key={empresa.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 leading-tight text-lg">{empresa.nombre}</h3>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{empresa.documento_identidad}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteSelected([empresa.id])}
                  disabled={updating}
                  title="Eliminar Empresa"
                  className="bg-white text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 p-2 rounded-xl transition-all border border-slate-100 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-7">
              <div className="mb-5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Plan de Suscripción</span>
                <div className="flex items-center gap-3 text-indigo-700 font-bold bg-indigo-50/50 px-4 py-3 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-100 mb-4">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base flex-1">{empresa.plan_nombre || empresa.planNombre}</span>
                </div>

                {empresa.planDescripcion && (
                  <p className="text-sm text-slate-600 mb-4 px-2 italic border-l-2 border-indigo-200">
                    {empresa.planDescripcion}
                  </p>
                )}
                
                {empresa.feature_toggles && (
                  <div className="mb-4 pt-2 border-t border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 pl-1">Módulos Habilitados</span>
                     <ul className="text-xs text-slate-600 font-medium flex flex-wrap gap-2">
                       {Array.isArray(empresa.feature_toggles) ? empresa.feature_toggles.map((mod, idx) => (
                         <li key={idx} className="bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 transition-transform hover:scale-105">
                           <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-sm"></span>
                           {mod}
                         </li>
                       )) : null}
                     </ul>
                  </div>
                )}
              </div>

              <div className="relative border-t border-slate-100 pt-5 mt-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Asignar Nuevo Nivel</span>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none appearance-none cursor-pointer pr-10 hover:bg-white"
                  value={empresa.plan_id || empresa.planId || ''}
                  onChange={(e) => {
                     if(onChangePlan) onChangePlan(empresa.id, parseInt(e.target.value));
                  }}
                  disabled={updating}
                >
                  {planesDisponibles.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                  ))}
                </select>
                <div className="absolute right-4 bottom-4 pointer-events-none text-slate-400">
                  <LayoutGrid className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredEmpresas.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron empresas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresaCards;

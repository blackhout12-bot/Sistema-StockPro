import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import moduleRegistry from '../config/moduleRegistry';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Trash2,
  Undo2,
  History,
  CheckSquare,
  Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * SuperAdmin Global Panel
 * Implementación Fase v1.28.2-superadmin-panel-restore
 */
const SuperAdmin = () => {
  const navigate = useNavigate();
  const { updateFeatureToggles, isSuperAdmin, setPlan, setPlanDescripcion } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  // v1.28.7 - Estados de selección y rollback
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastBackupId, setLastBackupId] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin && !loading) {
       setError('Acceso denegado: Se requieren privilegios de administrador global.');
    }
  }, [isSuperAdmin, loading]);

  // Lista de planes disponibles (Sincronizada con la BD)
  const planesDisponibles = [
    { id: 1, nombre: 'Retail Básico' },
    { id: 2, nombre: 'Logística Avanzada' },
    { id: 3, nombre: 'Manufactura Pro' },
    { id: 4, nombre: 'Servicios Premium' },
    { id: 5, nombre: 'Full Enterprise' }
  ];

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/empresas');
      setEmpresas(res.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar la plataforma global. Verifique permisos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleChangePlan = async (empresaId, nuevoPlanId) => {
    try {
      setUpdating(true);
      const res = await api.post('/superadmin/changePlan', { empresaId, nuevoPlanId });
      
      // Propagación inmediata mediante registry y context (v1.28.2)
      moduleRegistry.update(res.data.feature_toggles);
      updateFeatureToggles(res.data.feature_toggles);
      if (setPlan) setPlan(res.data.planNombre);
      if (setPlanDescripcion) setPlanDescripcion(res.data.planDescripcion);
      
      toast.success(`El plan de la empresa fue actualizado a ${res.data.planNombre}`);
      
      // Actualizar estado local
      setEmpresas(prev => prev.map(e => 
        e.id === empresaId ? { 
            ...e, 
            plan_id: nuevoPlanId, 
            plan_nombre: res.data.planNombre,
            planDescripcion: res.data.planDescripcion,
            feature_toggles: res.data.feature_toggles
        } : e
      ));
    } catch (err) {
      toast.error('Error al actualizar el plan empresarial');
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === empresas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(empresas.map(e => e.id));
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} empresas? Se realizará un backup automático.`)) return;

    try {
      setUpdating(true);
      const res = await api.post('/superadmin/deleteEmpresas', { empresaIds: selectedIds });
      toast.success(`${selectedIds.length} empresas eliminadas correctamente.`);
      setLastBackupId(res.data.backupId);
      setSelectedIds([]);
      fetchEmpresas();
    } catch (err) {
      toast.error('Error al realizar la eliminación masiva.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRollback = async () => {
    if (!lastBackupId) return;
    try {
      setUpdating(true);
      await api.post('/superadmin/rollbackEmpresas', { backupId: lastBackupId });
      toast.success('¡Rollback exitoso! Las empresas han sido restauradas.');
      setLastBackupId(null);
      fetchEmpresas();
    } catch (err) {
      toast.error('Error al restaurar el backup.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
      <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando plataforma global...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">SuperAdmin Global</h1>
            <p className="text-slate-500 font-medium italic flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Gestión centralizada de licencias y capacidades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
           {lastBackupId && (
             <button 
               onClick={handleRollback}
               className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-200 transition-all font-bold text-xs"
             >
               <Undo2 className="w-4 h-4" />
               DESHACER ÚLTIMO CAMBIO
             </button>
           )}
           <button 
              onClick={() => navigate('/superadmin/auditoria')}
              className="p-2.5 bg-white rounded-xl shadow-sm text-slate-600 hover:text-indigo-600 border border-slate-200 transition-all"
              title="Dashboard de Auditoría"
           >
              <History className="w-5 h-5" />
           </button>
           <button className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
              <LayoutGrid className="w-5 h-5" />
           </button>
           <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className="w-5 h-5" onClick={fetchEmpresas} />
           </button>
        </div>
      </div>

      {/* Action Bar para Selección Masiva */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-300 border border-slate-700/50 backdrop-blur-xl">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedIds.length}</div>
             <p className="text-sm font-bold text-slate-300">Empresas seleccionadas</p>
           </div>
           <div className="h-4 w-[1px] bg-slate-700" />
           <div className="flex items-center gap-4">
              <button 
                onClick={handleSelectAll}
                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                {selectedIds.length === empresas.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              <button 
                onClick={handleDeleteBulk}
                disabled={updating}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Permanente
              </button>
           </div>
        </div>
      )}

      {error ? (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-800 shadow-sm">
          <div className="p-3 bg-red-100 rounded-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg leading-none mb-1">Error de Autenticación Global</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {empresas.map(empresa => (
            <div key={empresa.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleSelection(empresa.id)}
                      className={`p-2.5 rounded-2xl border-2 transition-all ${selectedIds.includes(empresa.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-200'}`}
                    >
                      {selectedIds.includes(empresa.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 leading-tight text-lg">{empresa.nombre}</h3>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{empresa.documento_identidad}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 text-green-600 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-green-100 ring-2 ring-white">
                    Activo
                  </div>
                </div>
              </div>

              <div className="p-7">
                <div className="mb-5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Plan de Suscripción</span>
                  <div className="flex items-center gap-3 text-indigo-700 font-bold bg-indigo-50/50 px-4 py-3 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-100 mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-base">{empresa.plan_nombre}</span>
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

                <div className="relative">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Asignar Nuevo Nivel</span>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none appearance-none cursor-pointer pr-10 hover:bg-white"
                    value={empresa.plan_id}
                    onChange={(e) => handleChangePlan(empresa.id, parseInt(e.target.value))}
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
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;

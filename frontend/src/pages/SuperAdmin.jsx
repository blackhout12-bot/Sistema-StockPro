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
import EmpresaTable from './EmpresaTable';
import UsuarioTable from './UsuarioTable';

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
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState([]);
  const [usuariosSeleccionadas, setUsuariosSeleccionadas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [lastBackupId, setLastBackupId] = useState(null);
  const [view, setView] = useState('empresas'); // 'empresas' | 'usuarios'

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

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/superadmin/usuarios'); // Asumiendo este endpoint existe o se debe crear
      setUsuarios(res.data);
    } catch (err) {
      console.error('Error fetching global users:', err);
    }
  };

  useEffect(() => {
    fetchEmpresas();
    fetchUsuarios();
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

  const handleDeleteSelectedEmpresas = async (ids) => {
    if (!ids || ids.length === 0) {
      toast.error('No seleccionaste ninguna empresa');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar ${ids.length} empresas? Se realizará un backup automático.`)) return;

    try {
      setUpdating(true);
      const res = await api.post('/superadmin/deleteEmpresas', { empresaIds: ids });
      toast.success(`Empresas eliminadas: ${res.data.deleted.join(', ')}`);
      setLastBackupId(res.data.backupId);
      fetchEmpresas();
    } catch (err) {
      toast.error('Error al realizar la eliminación masiva.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSelectedUsuarios = async (ids) => {
    if (!ids || ids.length === 0) {
      toast.error('No seleccionaste ningún usuario');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar ${ids.length} usuarios? Se realizará un backup automático.`)) return;

    try {
      setUpdating(true);
      const res = await api.post('/superadmin/deleteUsuarios', { usuarioIds: ids });
      toast.success(`Usuarios eliminados: ${res.data.deleted.join(', ')}`);
      setLastBackupId(res.data.backupId);
      fetchUsuarios();
    } catch (err) {
      toast.error('Error al realizar la eliminación de usuarios.');
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
        <div className="space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => setView('empresas')}
                className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'empresas' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-indigo-600 border border-slate-200'}`}
              >
                Empresas
              </button>
              <button 
                onClick={() => setView('usuarios')}
                className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'usuarios' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-indigo-600 border border-slate-200'}`}
              >
                Usuarios Globales
              </button>
           </div>
           
           {view === 'empresas' ? (
             <EmpresaTable 
                empresas={empresas} 
                onDeleteSelected={handleDeleteSelectedEmpresas} 
                updating={updating}
             />
           ) : (
             <UsuarioTable 
                usuarios={usuarios} 
                onDeleteSelected={handleDeleteSelectedUsuarios} 
                updating={updating}
             />
           )}
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;

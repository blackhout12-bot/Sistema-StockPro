import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import moduleRegistry from '../config/moduleRegistry';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  RefreshCw, 
  ShieldCheck, 
  Undo2,
  Trash2,
  LayoutGrid,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmpresaTable from './EmpresaTable';
import UsuarioTable from './UsuarioTable';

const SuperAdminGestion = () => {
  const navigate = useNavigate();
  const { updateFeatureToggles, isSuperAdmin, setPlan, setPlanDescripcion } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastBackupId, setLastBackupId] = useState(null);
  const [view, setView] = useState('empresas');

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/empresas');
      setEmpresas(res.data);
    } catch (err) {
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/superadmin/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
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
      
      moduleRegistry.update(res.data.feature_toggles);
      updateFeatureToggles(res.data.feature_toggles);
      if (setPlan) setPlan(res.data.planNombre);
      if (setPlanDescripcion) setPlanDescripcion(res.data.planDescripcion);
      
      toast.success(`Plan actualizado a ${res.data.planNombre}`);
      fetchEmpresas();
    } catch (err) {
      toast.error('Error al actualizar plan');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteEmpresas = async (ids) => {
    if (!window.confirm(`¿Eliminar ${ids.length} empresas?`)) return;
    try {
      setUpdating(true);
      const res = await api.post('/superadmin/deleteEmpresas', { empresaIds: ids });
      toast.success('Empresas eliminadas');
      setLastBackupId(res.data.backupId);
      fetchEmpresas();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUsuarios = async (ids) => {
    if (!window.confirm(`¿Eliminar ${ids.length} usuarios?`)) return;
    try {
      setUpdating(true);
      const res = await api.post('/superadmin/deleteUsuarios', { usuarioIds: ids });
      toast.success('Usuarios eliminados');
      setLastBackupId(res.data.backupId);
      fetchUsuarios();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setUpdating(false);
    }
  };

  const handleRollback = async () => {
    if (!lastBackupId) return;
    try {
      setUpdating(true);
      await api.post('/superadmin/rollbackEmpresas', { backupId: lastBackupId });
      toast.success('Rollback exitoso');
      setLastBackupId(null);
      fetchEmpresas();
    } catch (err) {
      toast.error('Error en rollback');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando gestión global...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/superadmin')}
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600"
          >
            <Activity className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión Operativa</h1>
            <p className="text-slate-500 font-medium italic">Control total de entidades y licencias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {lastBackupId && (
             <button 
               onClick={handleRollback}
               className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl shadow-lg transition-all font-bold text-xs"
             >
               <Undo2 className="w-4 h-4" />
               RESTORE SNAPSHOT
             </button>
           )}
           <button className="p-2.5 bg-slate-800 text-white rounded-xl shadow-lg" onClick={fetchEmpresas}>
              <RefreshCw className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
          <button 
            onClick={() => setView('empresas')}
            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'empresas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Empresas
          </button>
          <button 
            onClick={() => setView('usuarios')}
            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'usuarios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Usuarios
          </button>
        </div>

        {view === 'empresas' ? (
          <EmpresaTable 
            empresas={empresas} 
            onDeleteSelected={handleDeleteEmpresas} 
            updating={updating}
            onChangePlan={handleChangePlan} // Inyectamos cambio de plan
          />
        ) : (
          <UsuarioTable 
            usuarios={usuarios} 
            onDeleteSelected={handleDeleteUsuarios} 
            updating={updating}
          />
        )}
      </div>
    </div>
  );
};

export default SuperAdminGestion;

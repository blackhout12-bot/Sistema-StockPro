import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import moduleRegistry from '../config/moduleRegistry';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { RefreshCw, Activity, Building2, Users as UsersIcon, Undo2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmpresaTable from './EmpresaTable';
import UsuarioTable from './UsuarioTable';
import RollbackPanel from '../components/RollbackPanel';
import AuditoriaPanel from '../components/AuditoriaPanel';

// Simple Tabs implementation
const Tabs = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-inner">
        {React.Children.map(children, child => {
          if (!child) return null;
          const isActive = activeTab === child.props.label;
          return (
            <button
              key={child.props.label}
              onClick={() => onTabChange(child.props.label)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${isActive ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              {child.props.icon}
              {child.props.label}
            </button>
          );
        })}
      </div>
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {React.Children.map(children, child => {
          if (child?.props.label === activeTab) return child.props.children;
          return null;
        })}
      </div>
    </div>
  );
};

const Tab = ({ children }) => <>{children}</>;

const SuperAdminGestion = () => {
  const navigate = useNavigate();
  const { updateFeatureToggles, setPlan, setPlanDescripcion } = useAuth();
  
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('Empresas');

  const fetchEmpresas = async () => {
    try {
      const res = await api.get(`/superadmin/empresas?_t=${Date.now()}`);
      setEmpresas(res.data);
    } catch (err) { toast.error('Error al cargar empresas'); }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await api.get(`/superadmin/usuarios?_t=${Date.now()}`);
      setUsuarios(res.data);
    } catch (err) {}
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchEmpresas(), fetchUsuarios()]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

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
    } catch (err) { toast.error('Error al actualizar plan'); } 
    finally { setUpdating(false); }
  };

  const handleDeleteEmpresas = async (ids) => {
    toast(`Iniciando borrado maestro de ${ids.length} empresa(s)...`, { icon: '🧹' });
    try {
      setUpdating(true);
      const res = await api.post('/superadmin/deleteEmpresas', { empresaIds: ids });
      toast.success(`Empresas eliminadas correctamente (ID: ${res.data.deleted.join(', ')}). Datos respaldados en Backup #${res.data.backupId}`);
      
      await Promise.all([fetchEmpresas(), fetchUsuarios()]);
    } catch (err) { 
      console.error(err);
      const msg = err.response?.data?.sqlError || err.response?.data?.details || err.response?.data?.error || err.message;
      toast.error(`Error al eliminar: ${msg}`);
    } 
    finally { setUpdating(false); }
  };

  const handleDeleteUsuarios = async (ids) => {
    if (!window.confirm(`¿Eliminar ${ids.length} usuarios?`)) return;
    try {
      setUpdating(true);
      await api.post('/superadmin/deleteUsuarios', { usuarioIds: ids });
      toast.success('Usuarios eliminados');
      fetchUsuarios();
    } catch (err) { toast.error('Error al eliminar'); } 
    finally { setUpdating(false); }
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
            title="Volver al Dashboard"
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-slate-600"
          >
            <Activity className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión Operativa Global</h1>
            <p className="text-slate-500 font-medium italic">Consola maestra de administración de entidades</p>
          </div>
        </div>

        <button className="p-3 bg-slate-800 hover:bg-slate-900 transition-colors text-white rounded-2xl shadow-lg" onClick={loadData} title="Refrescar datos">
          <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <Tab label="Empresas" icon={<Building2 className="w-4 h-4" />}>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <EmpresaTable empresas={empresas} onDeleteSelected={handleDeleteEmpresas} updating={updating} onChangePlan={handleChangePlan} />
          </div>
        </Tab>
        <Tab label="Usuarios" icon={<UsersIcon className="w-4 h-4" />}>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <UsuarioTable usuarios={usuarios} onDeleteSelected={handleDeleteUsuarios} updating={updating} />
          </div>
        </Tab>
        <Tab label="Rollback" icon={<Undo2 className="w-4 h-4" />}>
          <RollbackPanel />
        </Tab>
        <Tab label="Auditoría" icon={<ShieldCheck className="w-4 h-4" />}>
          <AuditoriaPanel />
        </Tab>
      </Tabs>
    </div>
  );
};

export default SuperAdminGestion;

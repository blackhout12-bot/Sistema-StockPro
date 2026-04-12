import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Settings,
  Activity,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando analítica global...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Global</h1>
            <p className="text-slate-500 font-medium italic">Estado de salud del ecosistema StockDB</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/superadmin/gestion')}
          className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:translate-x-1 transition-all shadow-lg"
        >
          <Settings className="w-4 h-4" />
          PANEL DE GESTIÓN
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <Building2 className="w-10 h-10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresas Activas</p>
          <h2 className="text-4xl font-black text-slate-800">{stats?.totalEmpresas}</h2>
          <div className="mt-4 flex items-center gap-2 text-green-500 text-xs font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>Sistema en crecimiento</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <Users className="w-10 h-10 text-violet-500 mb-6 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios Totales</p>
          <h2 className="text-4xl font-black text-slate-800">{stats?.totalUsuarios}</h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <Activity className="w-10 h-10 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acciones Recientes</p>
          <h2 className="text-4xl font-black text-slate-800">{stats?.ultimasAcciones?.length}</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            Distribución de Licencias
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.distribucionPlanes}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={5} dataKey="count" nameKey="nombre"
                >
                  {stats?.distribucionPlanes?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Registros de Auditoría Críticos
          </h3>
          <div className="space-y-4">
            {stats?.ultimasAcciones?.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${log.accion.includes('delete') ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{log.accion}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Actor: #{log.usuario_id}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400">
                  {format(new Date(log.timestamp), 'HH:mm', { locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;

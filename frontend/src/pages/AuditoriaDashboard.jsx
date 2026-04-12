import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/axiosConfig';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Calendar, 
  Filter, 
  ArrowLeft, 
  Activity, 
  ShieldAlert,
  Download,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const AuditoriaDashboard = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/auditoria/logs', { params: filters });
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  // Procesar datos para gráficos
  const chartData = useMemo(() => {
    const daily = {};
    const distribution = {};

    logs.forEach(log => {
      const day = format(new Date(log.timestamp), 'yyyy-MM-dd');
      daily[day] = (daily[day] || 0) + 1;
      
      const tipo = log.accion || 'otro';
      distribution[tipo] = (distribution[tipo] || 0) + 1;
    });

    const dailyArray = Object.keys(daily).map(date => ({
      date,
      count: daily[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const distArray = Object.keys(distribution).map(name => ({
      name,
      value: distribution[name]
    }));

    return { dailyArray, distArray };
  }, [logs]);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/superadmin')}
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-600" />
              Auditoría Global
            </h1>
            <p className="text-slate-500 font-medium italic">Trazabilidad total de acciones administrativas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar en logs..."
               className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none w-64 shadow-sm"
               onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
             />
           </div>
           <button className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg active:scale-95">
             <Download className="w-4 h-4" />
             Exportar CSV
           </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Actividad por Día
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.dailyArray}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: '800', color: '#6366f1' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Distribución de Acciones
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.distArray}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.distArray.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest pl-4">Historial Detallado</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Desde:</span>
              <input 
                type="date" 
                className="p-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Hasta:</span>
              <input 
                type="date" 
                className="p-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha & Hora</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acción</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Usuario ID</th>
                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Detalle / IDs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">
                    {format(new Date(log.timestamp), 'PPp', { locale: es })}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      log.accion.includes('delete') ? 'bg-red-50 text-red-600' : 
                      log.accion.includes('rollback') ? 'bg-amber-50 text-amber-600' : 
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                    # {log.usuario_id}
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 italic max-w-xs truncate">
                    {log.valor_nuevo || JSON.stringify(log.valor_nuevo)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron registros de auditoría</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaDashboard;

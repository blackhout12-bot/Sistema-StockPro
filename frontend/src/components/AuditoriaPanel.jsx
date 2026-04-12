import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/axiosConfig';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Calendar, ShieldAlert, Download, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const AuditoriaPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tipo: '', fechaDesde: '', fechaHasta: '' });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/auditoria/logs', { params: filters });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filters]);

  const chartData = useMemo(() => {
    const daily = {};
    const distribution = {};
    logs.forEach(log => {
      const day = format(new Date(log.timestamp), 'yyyy-MM-dd');
      daily[day] = (daily[day] || 0) + 1;
      const tipo = log.accion || 'otro';
      distribution[tipo] = (distribution[tipo] || 0) + 1;
    });
    const dailyArray = Object.keys(daily).map(date => ({ date, count: daily[date] })).sort((a, b) => new Date(a.date) - new Date(b.date));
    const distArray = Object.keys(distribution).map(name => ({ name, value: distribution[name] }));
    return { dailyArray, distArray };
  }, [logs]);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Panel de Auditoría</h2>
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Buscar en logs..." className="pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm" onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))} />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-slate-900 transition-all">
             <Download className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> Actividad por Día</h3>
          <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData.dailyArray}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: '800', color: '#6366f1' }} /><Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Distribución</h3>
          <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData.distArray} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">{chartData.distArray.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend layout="vertical" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} /></PieChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Historial</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400">Desde:</span><input type="date" className="p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100" onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-400">Hasta:</span><input type="date" className="p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100" onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))} /></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Acción</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Usuario</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">IDs afectados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-bold text-slate-700">{format(new Date(log.timestamp), 'PPp', { locale: es })}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${log.accion.includes('delete') ? 'bg-red-50 text-red-600' : log.accion.includes('rollback') ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{log.accion}</span></td>
                  <td className="px-6 py-3 text-slate-600 font-bold">Admin #{log.usuario_id}</td>
                  <td className="px-6 py-3 text-slate-500 max-w-[200px] truncate">{log.entidad_id || log.valor_nuevo || 'N/A'}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (<tr><td colSpan="4" className="px-6 py-12 text-center"><History className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No registros</p></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditoriaPanel;

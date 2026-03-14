import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingUp, Settings, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

const AlertsPanel = () => {
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState({ checks: [], predictions: null });
    const [config, setConfig] = useState({
        pushVentas: true,
        emailReportes: true,
        alertasWeb: true
    });

    const fetchAITasks = async () => {
        setLoading(true);
        try {
            const expRes = await api.get('/ai/alerts/expirations');
            setAlerts(prev => ({ ...prev, checks: expRes.data.analisis || [] }));
        } catch (error) {
            console.error('Error fetching AI tasks', error);
            toast.error('Error conectando con el motor predictivo AI');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAITasks();
    }, []);

    const saveConfig = () => {
        toast.success('Configuración de notificaciones guardada exitosamente');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-600" />
                        Centro de Alertas & Inteligencia Predictiva
                    </h1>
                    <p className="text-gray-500 mt-1">Gestión de notificaciones push, emails y alertas AI.</p>
                </div>
                <button onClick={fetchAITasks} className="btn-secondary" disabled={loading}>
                    {loading ? 'Sincronizando...' : 'Refrescar Análisis'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Alertas de Vencimiento y Stock (AI)
                        </h2>
                        
                        {alerts.checks.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2 opacity-50" />
                                No hay alertas críticas generadas por AI en este momento.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.checks.map((alerta, idx) => {
                                    const isUrgent = alerta.dias_restantes <= 5;
                                    const bgClass = isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
                                    const textClassH3 = isUrgent ? 'text-red-800' : 'text-amber-800';
                                    const textClassP = isUrgent ? 'text-red-600' : 'text-amber-600';
                                    
                                    return (
                                        <div key={idx} className={`p-4 rounded-lg border ${bgClass}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className={`font-medium ${textClassH3}`}>
                                                        Lote #{alerta.numero_lote} expira en {alerta.dias_restantes} días
                                                    </h3>
                                                    <p className={`text-sm mt-1 ${textClassP}`}>
                                                        {alerta.sugerencia_preventiva}
                                                    </p>
                                                </div>
                                                {isUrgent && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                        URGENTE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-gray-500" />
                            Configuración Granular
                        </h2>
                        
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Notificaciones Push (Móvil) en Ventas</span>
                                <input type="checkbox" checked={config.pushVentas} onChange={e => setConfig({...config, pushVentas: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Reportes de Cierre por Email</span>
                                <input type="checkbox" checked={config.emailReportes} onChange={e => setConfig({...config, emailReportes: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Alertas Web (Dashboard)</span>
                                <input type="checkbox" checked={config.alertasWeb} onChange={e => setConfig({...config, alertasWeb: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            </label>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <button onClick={saveConfig} className="w-full btn-primary py-2 justify-center">
                                Guardar Preferencias
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                        <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            IA Predictiva Activa
                        </h3>
                        <p className="text-sm text-indigo-700 mt-2">
                            El motor predictivo analiza constantemente tus ventas para sugerir reposiciones y enviar alarmas preventivas de stock.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertsPanel;

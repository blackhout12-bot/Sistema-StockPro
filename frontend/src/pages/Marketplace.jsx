import React, { useState, useEffect } from 'react';
import { Store, Download, CheckCircle2, LayoutGrid, Cpu, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

const Marketplace = () => {
    const [modulos, setModulos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(null);

    const fetchModulos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ecosistema', { baseURL: '/api/v2' });
            setModulos(res.data);
        } catch (error) {
            console.error('Error cargando marketplace:', error);
            toast.error('Error al cargar los módulos del ecosistema.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModulos();
    }, []);

    const handleInstall = async (moduloId) => {
        setInstalling(moduloId);
        try {
            const res = await api.post('/ecosistema/install', { modulo_id: moduloId }, { baseURL: '/api/v2' });
            toast.success(res.data.message);
            fetchModulos(); // Refrescar estado para ver el check verde
        } catch (error) {
            console.error('Error instalando módulo:', error);
            toast.error('Falló la instalación del módulo.');
        } finally {
            setInstalling(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Store className="w-7 h-7 text-primary-600" />
                        Marketplace & Ecosistema
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Amplía las capacidades de tu plataforma instalando módulos especializados por rubro.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modulos.map(mod => (
                        <div key={mod.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 border border-primary-100">
                                    <LayoutGrid className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{mod.nombre}</h3>
                                <p className="text-sm text-gray-500 mb-4">{mod.descripcion}</p>
                                
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                                    <Cpu className="w-3.5 h-3.5" />
                                    Requiere API v{mod.versionApi}
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50">
                                {mod.instalado ? (
                                    <div className="flex items-center justify-center gap-2 text-success-600 font-semibold py-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Módulo Instalado
                                        <span className="text-xs text-slate-400 font-normal ml-2">({new Date(mod.fecha_instalacion).toLocaleDateString()})</span>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleInstall(mod.id)}
                                        disabled={installing === mod.id}
                                        className="w-full btn-primary flex items-center justify-center gap-2"
                                    >
                                        {installing === mod.id ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" /> Activar Módulo
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white flex items-center justify-between">
                <div className="max-w-xl">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <TrendingUp className="text-emerald-400" />
                        API Externa y Webhooks (v2)
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Tu plan incluye acceso bidireccional mediante API Key (v2). Ahora puedes integrar servicios de terceros 
                        al instante conectando su sistema a nuestros webhooks seguros HMAC en <code>/api/v2/webhooks/secure/</code>.
                    </p>
                </div>
                <div className="hidden lg:block">
                    <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2 rounded-xl transition-all">
                        Ver Documentación
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;

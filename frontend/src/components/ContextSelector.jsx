import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { Network, ChevronDown, CheckCircle2 } from 'lucide-react';

const ContextSelector = () => {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // 1. Obtener los contextos vivos del operador logueado
    const { data: misContextos, isLoading } = useQuery({
        queryKey: ['mis-contextos'],
        queryFn: async () => {
            const res = await api.get('/contextos/mis-contextos');
            return res.data;
        }
    });

    // 2. Determinar contexto activo actual. Podría cruzarse con auth store/JWT
    // Por simplicidad en la demo, asumo que el backend ya respondió con el actual
    // o determinamos el contexto primario en base a window.localStorage
    const currentContextId = Number(localStorage.getItem('contexto_id')) || (misContextos?.[0]?.id);

    // 3. Mutación de Cambio de Contexto al Backend
    const mutacionCambio = useMutation({
        mutationFn: async (id_contexto) => api.put(`/contextos/switch/${id_contexto}`),
        onSuccess: (data, variables) => {
            localStorage.setItem('contexto_id', variables);
            toast.success(`Contexto asignado: ${data.data.sucursal_activa}`);
            queryClient.invalidateQueries(); // Forzar recarga de DataGrid y Dashboards
            setIsOpen(false);
            window.location.reload(); // Recarga brutal segura para que zustand limpie cache
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error forzando contexto');
        }
    });

    const activeContext = misContextos?.find(c => c.id === currentContextId) || misContextos?.[0];

    if (isLoading || !misContextos || misContextos.length <= 1) {
        return null; // Ocultar si sólo pertenece a una sucursal histórica vacía
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-colors shadow-sm"
            >
                <Network className="w-4 h-4 text-indigo-600" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 leading-none">Contexto Organizacional</span>
                    <span className="text-sm font-bold text-indigo-900 leading-tight">
                        {activeContext ? activeContext.nombre : 'No asignado'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-indigo-600 p-4">
                        <p className="text-white text-xs font-bold uppercase tracking-wide opacity-80">Franquicias / Tiendas</p>
                        <p className="text-white text-sm font-medium mt-0.5">Selecciona tu contexto de trabajo</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                        {misContextos.map(ctx => {
                            const isSelected = ctx.id === currentContextId;
                            return (
                                <button
                                    key={ctx.id}
                                    onClick={() => mutacionCambio.mutate(ctx.id)}
                                    disabled={mutacionCambio.isPending}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
                                        isSelected 
                                            ? 'bg-indigo-50/80 border border-indigo-100' 
                                            : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                                >
                                    <div className="text-left">
                                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                            {ctx.nombre}
                                        </p>
                                        <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5 mt-0.5">
                                            Rol heredado: <span className="text-indigo-600 bg-indigo-50 px-1.5 rounded">{ctx.rol_local || 'OPERADOR'}</span>
                                        </p>
                                    </div>
                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContextSelector;

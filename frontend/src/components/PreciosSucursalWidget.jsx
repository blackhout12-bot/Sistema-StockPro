import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { Store, Save, RefreshCw } from 'lucide-react';

const PreciosSucursalWidget = ({ producto_id, precioBase }) => {
  const queryClient = useQueryClient();

  // Fetch sucursales
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const res = await api.get('/sucursales');
      return res.data;
    }
  });

  // Fetch precios configurados
  const { data: precios = [], isLoading } = useQuery({
    queryKey: ['precios-sucursal', producto_id],
    queryFn: async () => {
      const res = await api.get(`/productos/${producto_id}/precios-sucursal`);
      return res.data;
    }
  });

  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

  const handlePriceChange = (sucursalId, val) => {
    setEditValues(prev => ({ ...prev, [sucursalId]: val }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ sucursal_id, precio }) => {
      await api.post(`/productos/${producto_id}/precios-sucursal`, { sucursal_id, precio });
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['precios-sucursal', producto_id]);
        toast.success("Precio actualizado exitosamente");
    },
    onError: () => toast.error("Error al asignar el precio")
  });

  const handleSave = async (sucursalId) => {
    let rawVal = editValues[sucursalId];
    if (rawVal === undefined) return;
    if (rawVal === '') rawVal = precioBase; // reset to base
    
    const num = parseFloat(rawVal);
    if (isNaN(num) || num < 0) {
        toast.error("Precio inválido");
        return;
    }
    
    setSaving(true);
    await saveMutation.mutateAsync({ sucursal_id: sucursalId, precio: num });
    setSaving(false);
  };

  if (isLoading) return <div className="text-xs text-slate-400">Cargando cotizaciones...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Store size={14} className="text-indigo-500" />
        <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Precios Diferenciados por Sucursal</label>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {sucursales.map(suc => {
            const configured = precios.find(p => p.sucursal_id === suc.id);
            const currentPrice = editValues[suc.id] !== undefined ? editValues[suc.id] : (configured ? configured.precio : '');
            
            return (
                <div key={suc.id} className="flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-xl">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">{suc.nombre}</p>
                        <p className="text-[9px] text-slate-400 font-medium">
                            {configured ? 'Precio Sobrescrito' : 'Precio Base P/Defecto'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-24 bg-surface-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-500/10 outline-none text-right placeholder:text-slate-300"
                            placeholder={precioBase}
                            value={currentPrice}
                            onChange={(e) => handlePriceChange(suc.id, e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => handleSave(suc.id)}
                            disabled={saving || editValues[suc.id] === undefined}
                            className={`p-2 rounded-lg transition-all ${editValues[suc.id] !== undefined ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-50 text-slate-300'}`}
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
      <p className="text-[10px] text-slate-400 italic">Si dejas el campo vacío retornará al valor genérico del artículo.</p>
    </div>
  );
};

export default PreciosSucursalWidget;

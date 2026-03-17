import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronRight, ChevronLeft, Save, Info, DollarSign } from 'lucide-react';

const ProductForm = ({ onAdd, onUpdate, isModal, closeModal, initialData }) => {
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [precio, setPrecio] = useState(initialData?.precio || '');
  const [stock, setStock] = useState(initialData?.stock || '');
  const [categoria, setCategoria] = useState(initialData?.categoria || '');
  
  // Custom Fields (Conversión Object -> Array para UI)
  const [customFieldsList, setCustomFieldsList] = useState(() => {
    if (!initialData?.custom_fields) return [];
    try {
      const parsed = typeof initialData.custom_fields === 'string' ? JSON.parse(initialData.custom_fields) : initialData.custom_fields;
      return Object.entries(parsed).map(([key, val]) => ({ key, value: String(val) }));
    } catch { return []; }
  });

  const addCustomField = () => setCustomFieldsList([...customFieldsList, { key: '', value: '' }]);
  const updateCustomField = (index, field, val) => {
    const list = [...customFieldsList];
    list[index][field] = val;
    setCustomFieldsList(list);
  };
  const removeCustomField = (index) => setCustomFieldsList(customFieldsList.filter((_, i) => i !== index));

  const handleNext = () => {
      if (!nombre.trim()) {
          toast.error('El nombre del producto es obligatorio');
          return;
      }
      setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!precio) {
        toast.error('El precio unitario es obligatorio');
        return;
    }

    // Re-conversión Array -> Object para la DB
    const custom_fields = customFieldsList.reduce((acc, curr) => {
      if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
      return acc;
    }, {});

    const productData = {
      nombre,
      sku: sku.trim() || null,
      descripcion,
      precio: parseFloat(precio),
      stock: parseInt(stock) || 0,
      categoria,
      custom_fields
    };

    if (initialData?.id) {
      onUpdate(initialData.id, productData);
    } else {
      onAdd(productData);
    }

    if (!isModal) {
      setNombre('');
      setSku('');
      setDescripcion('');
      setPrecio('');
      setStock('');
      setCategoria('');
      setCustomFieldsList([]);
      setStep(1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary-500 -z-10 rounded-full transition-all duration-500" style={{ width: step === 1 ? '0%' : '100%' }}></div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= 1 ? 'bg-primary-600 text-white shadow-soft shadow-primary-500/30' : 'bg-surface-50 text-slate-400 border border-slate-200'}`}><Info size={14} /></div>
           <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step >= 1 ? 'text-primary-600' : 'text-slate-400'}`}>General</span>
        </div>
        <div className="flex flex-col items-center gap-2 bg-white px-2">
           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= 2 ? 'bg-primary-600 text-white shadow-soft shadow-primary-500/30' : 'bg-surface-50 text-slate-400 border border-slate-200'}`}><DollarSign size={14} /></div>
           <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step >= 2 ? 'text-primary-600' : 'text-slate-400'}`}>Comercial</span>
        </div>
      </div>

      <div className="min-h-[220px]">
          {/* PASO 1: Información General */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Producto *</label>
                    <input autoFocus type="text" required className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:font-medium" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Monitor UltraWide 34'" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                    <input type="text" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Periféricos" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción Técnica</label>
                    <textarea className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all min-h-[80px]" rows="2" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describa las especificaciones principales..."></textarea>
                  </div>
              </div>
            </div>
          )}

          {/* PASO 2: Inventario y Precios */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código / SKU</label>
                <input autoFocus type="text" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-base font-black text-primary-600 focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono uppercase" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="REF-000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Precio Unitario ($) *</label>
                  <input type="number" required step="0.01" min="0" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-4 text-lg font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{initialData ? 'Stock Actual' : 'Stock Inicial'}</label>
                  <input type="number" min="0" className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-4 text-lg font-black focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-mono" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campos Personalizados (Metadata)</label>
                  <button type="button" onClick={addCustomField} className="text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                    + Añadir Campo
                  </button>
                </div>
                
                {customFieldsList.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 italic text-center py-4">No hay atributos adicionales. Haz clic en "Añadir Campo" para agregar Color, Talle, Marca, etc.</p>
                ) : (
                  <div className="space-y-3">
                    {customFieldsList.map((cf, idx) => (
                      <div key={idx} className="flex gap-2 items-start animate-in fade-in zoom-in duration-200">
                        <input
                          type="text"
                          placeholder="Propiedad (ej. Color)"
                          className="flex-1 bg-surface-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary-500/10 outline-none"
                          value={cf.key}
                          onChange={(e) => updateCustomField(idx, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Valor"
                          className="flex-[2] bg-surface-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-primary-500/10 outline-none"
                          value={cf.value}
                          onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                        />
                        <button type="button" onClick={() => removeCustomField(idx)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            <span className="sr-only">Eliminar</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      <div className="flex gap-4 pt-8 border-t border-slate-100 mt-2">
        {step === 1 && isModal && (
          <button className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center" type="button" onClick={closeModal}>
            Cancelar
          </button>
        )}
        {step === 2 && (
          <button className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center justify-center gap-2" type="button" onClick={() => setStep(1)}>
            <ChevronLeft size={16} /> Atrás
          </button>
        )}
        
        {step === 1 ? (
          <button className="flex-[2] px-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2" type="button" onClick={handleNext}>
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button className="flex-[2] px-6 py-4 bg-gradient-to-tr from-primary-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:shadow-xl hover:shadow-primary-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3" type="submit">
            <Save size={16} />
            {initialData ? 'Actualizar Producto' : 'Guardar y Finalizar'}
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;

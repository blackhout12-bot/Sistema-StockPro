import React, { useState } from 'react';

const ProductForm = ({ onAdd, onUpdate, isModal, closeModal, initialData }) => {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [precio, setPrecio] = useState(initialData?.precio || '');
  const [stock, setStock] = useState(initialData?.stock || '');
  const [categoria, setCategoria] = useState(initialData?.categoria || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !precio) return;

    const productData = {
      nombre,
      sku: sku.trim() || null,
      descripcion,
      precio: parseFloat(precio),
      stock: parseInt(stock) || 0,
      categoria
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Producto *</label>
        <input
          type="text"
          required
          className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:font-medium"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Monitor UltraWide 34'"
        />
      </div>

      {/* SKU y Categoría en la misma fila */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código / SKU</label>
          <input
            type="text"
            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono uppercase"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="REF-000"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
          <input
            type="text"
            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej: Periféricos"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción</label>
        <textarea
          className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all min-h-[100px]"
          rows="3"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describa las especificaciones del producto..."
        />
      </div>

      {/* Precio y Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Precio Unitario ($) *</label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            {initialData ? 'Stock Actual' : 'Stock Inicial'}
          </label>
          <input
            type="number"
            min="0"
            className="w-full bg-surface-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all font-mono"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        {isModal && (
          <button
            className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
            type="button"
            onClick={closeModal}
          >
            Anular
          </button>
        )}
        <button
          className="flex-[2] px-6 py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-700 transition-all shadow-soft active:scale-[0.98]"
          type="submit"
        >
          {initialData ? 'Actualizar Registro' : 'Confirmar Registro'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;

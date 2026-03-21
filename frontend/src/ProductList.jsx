import { Edit, Trash2, Box, PlusCircle, Hammer, ShoppingCart } from 'lucide-react';

const ProductList = ({ products, onEdit, onDelete, onViewLots, onAddStock, userRole, hasLotesToggle, featureToggles }) => {
  const isAdmin = userRole?.toLowerCase() === 'admin';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-10 py-5">Código / SKU</th>
            <th className="px-10 py-5">Producto</th>
            <th className="px-6 py-5">Categoría</th>
            <th className="px-6 py-5">Descripción</th>
            <th className="px-6 py-5 text-right">Precio</th>
            <th className="px-10 py-5 text-center">Stock Total</th>
            {isAdmin && (
              <th className="px-10 py-5 text-right">Control</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-primary-50/20 transition-colors group">
              {/* SKU */}
              <td className="px-10 py-5">
                {p.sku ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-mono font-black bg-surface-50 text-slate-500 border border-slate-100 uppercase tracking-tighter">
                    {p.sku}
                  </span>
                ) : (
                  <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest opacity-40">Sin SKU</span>
                )}
              </td>
              {/* Nombre */}
              <td className="px-10 py-5">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">{p.nombre}</p>
                  {featureToggles?.mod_produccion && (() => {
                      try {
                          const custom = typeof p.custom_fields === 'string' ? JSON.parse(p.custom_fields) : p.custom_fields;
                          if (custom?.es_materia_prima === 'true') {
                              return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100" title="Materia Prima"><Hammer size={10} /> MP</span>;
                          }
                      } catch (e) {}
                      return null;
                  })()}
                  {featureToggles?.mod_marketplace && (() => {
                      try {
                          const custom = typeof p.custom_fields === 'string' ? JSON.parse(p.custom_fields) : p.custom_fields;
                          if (custom?.publicar_ecommerce === 'true') {
                              return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100" title="Publicado en E-Commerce"><ShoppingCart size={10} /> WEB</span>;
                          }
                      } catch (e) {}
                      return null;
                  })()}
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">ID Sistema: {p.id}</p>
              </td>
              {/* Categoría */}
              <td className="px-6 py-5">
                {p.categoria ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black bg-primary-50 text-primary-600 border border-primary-100/50 uppercase tracking-wider">
                    {p.categoria}
                  </span>
                ) : (
                  <span className="text-slate-300 italic text-[10px] font-bold">General</span>
                )}
              </td>
              {/* Descripción */}
              <td className="px-6 py-5">
                <p className="text-xs font-medium text-slate-500 max-w-[180px] truncate" title={p.descripcion}>
                  {p.descripcion || '—'}
                </p>
              </td>
              {/* Precio */}
              <td className="px-6 py-5 text-right">
                <span className="font-mono font-black text-slate-900 text-sm tracking-tighter">${Number(p.precio).toLocaleString()}</span>
              </td>
              {/* Stock */}
              <td className="px-10 py-5 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${p.stock === 0
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : p.stock <= 5
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  <div className={`w-1 h-1 rounded-full ${p.stock === 0 ? 'bg-rose-500' : p.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  {p.stock === 0 ? 'Agotado' : `${p.stock} Unid.`}
                </span>
              </td>
              {/* Acciones */}
              {isAdmin && (
                <td className="px-10 py-5 text-right">
                  <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    {hasLotesToggle && (
                      <button
                        onClick={() => onViewLots(p)}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-primary-600 hover:border-primary-200 rounded-xl transition-all shadow-sm"
                        title="Ver lotes"
                      >
                        <Box size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onAddStock(p)}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 rounded-xl transition-all shadow-sm"
                      title="Entrada de stock"
                    >
                      <PlusCircle size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="w-9 h-9 flex items-center justify-center bg-primary-50 text-primary-600 border border-primary-100 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 bg-surface-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100">
            <Box size={32} strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catalogo sin existencias</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;

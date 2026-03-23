import React from 'react';
import { Package } from 'lucide-react';

const fallbacks = {
    medicamento: 'https://cdn-icons-png.flaticon.com/512/2865/2865889.png',
    indumentaria: 'https://cdn-icons-png.flaticon.com/512/2806/2806132.png',
    lacteos: 'https://cdn-icons-png.flaticon.com/512/2674/2674505.png',
    general: 'https://cdn-icons-png.flaticon.com/512/411/411710.png'
};

const RubroShowcaseCard = ({ producto, rubro }) => {
    if (!producto) return null;

    // Determine the unique fields based on `custom_fields`
    let fields = {};
    if (producto.custom_fields) {
        try {
            const parsed = typeof producto.custom_fields === 'string' 
                ? JSON.parse(producto.custom_fields) 
                : producto.custom_fields;
            if (parsed && typeof parsed === 'object') {
                fields = parsed;
            }
        } catch(e) {}
    }

    let finalImageStr = null;
    if (producto.image_url) {
        try {
            const parsed = typeof producto.image_url === 'string' ? JSON.parse(producto.image_url) : producto.image_url;
            finalImageStr = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : (typeof parsed === 'string' ? parsed : null);
        } catch(e) {
            finalImageStr = typeof producto.image_url === 'string' ? producto.image_url : null;
        }
    }

    // Normalized backslashes (Windows FS) to forward slashes (Web)
    if (typeof finalImageStr === 'string') {
        finalImageStr = finalImageStr.replace(/\\/g, '/');
    }

    const isAbsolute = typeof finalImageStr === 'string' && finalImageStr.startsWith('http');
    
    // Usar rutas relativas directamente para aprovechar el proxy de Dev o el mismo origin en Prod
    const imageUrl = finalImageStr
        ? (isAbsolute ? finalImageStr : `${finalImageStr.startsWith('/') ? '' : '/'}${finalImageStr}?v=4`)
        : (fallbacks[rubro?.toLowerCase()] || fallbacks.general);

    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-200 p-5 flex flex-col h-full transition-all duration-300">
            {/* Cabecera: Imagen y Título en Flex */}
            <div className="flex gap-4 mb-5 items-stretch">
                {/* Contenedor de Imagen */}
                <div className="w-24 h-24 flex-shrink-0 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                    <img 
                        src={imageUrl} 
                        alt={producto.nombre}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-sm"
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[rubro?.toLowerCase()] || fallbacks.general; }}
                    />
                </div>
                {/* Títulos */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                    <span className="text-[10px] font-black tracking-widest uppercase text-brand-base mb-1">
                        {rubro === 'medicamento' ? 'Medicamento' : 'Producto'}
                    </span>
                    <h3 className="text-sm font-black text-slate-800 leading-snug line-clamp-2" title={producto.nombre}>
                        {producto.nombre}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">SKU</span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{producto.codigo || 'S/N'}</span>
                    </div>
                </div>
            </div>

            {/* Atributos en Grid elegante */}
            {Object.keys(fields).length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100/50">
                    {Object.entries(fields).slice(0, 4).map(([key, rawval]) => {
                        const label = key.replace(/_/g, ' ');
                        const val = typeof rawval === 'boolean' || rawval === 'true' || rawval === 'false' 
                            ? (rawval === 'true' || rawval === true ? 'Sí' : 'No') 
                            : rawval;

                        return (
                            <div key={key} className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 mb-0.5 truncate">{label}</span>
                                <span className="text-xs font-semibold text-slate-700 truncate" title={val}>{val || '-'}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer: Stock */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Stock Info</span>
                <div className="flex items-baseline gap-1.5 px-3 py-1 bg-brand-light/10 rounded-full border border-brand-light/20">
                    <span className="text-lg font-black text-brand-dark">{producto.stock}</span>
                    <span className="text-[10px] font-bold text-brand-base uppercase tracking-widest">Uds</span>
                </div>
            </div>
        </div>
    );
};

export default RubroShowcaseCard;

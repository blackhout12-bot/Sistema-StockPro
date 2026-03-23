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
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/60 overflow-hidden flex flex-col h-full transition-all duration-300 group">
            {/* Image Container Header */}
            <div className="relative h-44 w-full bg-slate-50/50 flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={producto.nombre}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
                    onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[rubro?.toLowerCase()] || fallbacks.general; }}
                />
                {/* Category Badge overlay */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg border border-slate-200/50">
                    <span className="text-[9px] font-black tracking-widest uppercase text-brand-dark">
                        {rubro === 'medicamento' ? 'Medicamento' : 'Catálogo'}
                    </span>
                </div>
            </div>

            {/* Content Container */}
            <div className="p-5 flex flex-col flex-1">
                {/* Header Text */}
                <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 leading-snug line-clamp-2 mb-1" title={producto.nombre}>
                        {producto.nombre}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                        SKU: <span className="text-slate-600">{producto.codigo || 'S/N'}</span>
                    </p>
                </div>

                {/* Attributes (Floating Tags) */}
                {Object.keys(fields).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                        {Object.entries(fields).slice(0, 4).map(([key, rawval]) => {
                            const label = key.replace(/_/g, ' ');
                            const val = typeof rawval === 'boolean' || rawval === 'true' || rawval === 'false' 
                                ? (rawval === 'true' || rawval === true ? 'Sí' : 'No') 
                                : rawval;

                            return (
                                <div key={key} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md max-w-full">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 whitespace-nowrap">{label}:</span>
                                    <span className="text-[10px] font-semibold text-slate-700 truncate">{val || '-'}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer: Stock */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disponibilidad</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-brand-dark">{producto.stock}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">uds</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RubroShowcaseCard;

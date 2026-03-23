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
    
    // Obtener la url raíz del backend removiendo explícitamente el segmento /api/v...
    const backendRoot = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v\d+\/?$/, '');
    
    const imageUrl = finalImageStr
        ? (isAbsolute ? finalImageStr : `${backendRoot}${finalImageStr.startsWith('/') ? '' : '/'}${finalImageStr}`)
        : (fallbacks[rubro?.toLowerCase()] || fallbacks.general);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 relative overflow-visible flex flex-col min-h-[16rem]">
            {/* Header */}
            <h3 className="text-[13px] font-black text-brand-dark mb-4 pr-[80px] break-words">
                <span className="opacity-70">{rubro === 'medicamento' ? 'Medicamento: ' : 'Producto: '}</span> 
                <br/>
                <span className="text-slate-800 text-sm whitespace-normal leading-tight">{producto.nombre}</span>
            </h3>

            {/* Fields list */}
            <div className="space-y-2 mb-6 relative z-10 w-2/3 flex-1 flex flex-col justify-center">
                <div className="flex flex-col mb-1 border-b border-slate-50 pb-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">SKU</span>
                    <span className="text-xs font-bold text-slate-700">{producto.codigo || 'S/N'}</span>
                </div>
                
                {Object.entries(fields).slice(0, 4).map(([key, rawval]) => {
                    const label = key.replace(/_/g, ' ');
                    const val = typeof rawval === 'boolean' || rawval === 'true' || rawval === 'false' 
                        ? (rawval === 'true' || rawval === true ? 'Sí' : 'No') 
                        : rawval;

                    return (
                        <div key={key} className="flex flex-col py-0.5">
                            <span className="text-[10px] font-black tracking-widest uppercase text-brand-base/80">{label}</span>
                            <span className="text-[11px] font-semibold text-slate-700">{val || '-'}</span>
                        </div>
                    );
                })}
            </div>

            {/* Bottom: Stock */}
            <div className="mt-auto pt-3 border-t border-slate-100 relative z-10">
                <span className="text-[10px] font-black text-brand-base uppercase tracking-widest mr-2">Stock Actual:</span>
                <span className="text-lg font-black text-slate-900">{producto.stock}</span>
                <span className="text-xs font-bold text-slate-500 ml-1">unidades</span>
            </div>

            {/* Floating Image 3D Pop Exagerado */}
            <div className="absolute -right-8 top-[45%] -translate-y-[55%] w-44 h-44 z-30 drop-shadow-2xl pointer-events-none transition-transform hover:scale-[1.15] duration-500 scale-[1.3]">
                <img 
                    src={imageUrl} 
                    alt={producto.nombre}
                    className="w-full h-full object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)]"
                    onError={(e) => { e.target.onerror = null; e.target.src = fallbacks[rubro?.toLowerCase()] || fallbacks.general; }}
                />
            </div>
            
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-brand-light/40 to-transparent rounded-r-2xl z-0 pointer-events-none" />
        </div>
    );
};

export default RubroShowcaseCard;

// frontend/src/components/EmpresaSelector.js
// Modal que aparece cuando el usuario tiene acceso a múltiples empresas.
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, ShoppingBag, ArrowRight } from 'lucide-react';

const ROL_CONFIG = {
    admin: { label: 'Administrador', color: 'text-indigo-600 bg-indigo-50', icon: Shield },
    vendedor: { label: 'Vendedor', color: 'text-green-600 bg-green-50', icon: ShoppingBag },
};

const EmpresaSelector = () => {
    const { empresaSelector, selectEmpresa } = useAuth();

    if (!empresaSelector) return null;

    const { empresas } = empresaSelector;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-indigo-50 p-2.5 rounded-xl">
                            <Building2 size={22} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Seleccioná tu empresa</h2>
                            <p className="text-sm text-gray-500">Tenés acceso a {empresas.length} empresas</p>
                        </div>
                    </div>
                </div>

                {/* Lista de empresas */}
                <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
                    {empresas.map((empresa) => {
                        const rolInfo = ROL_CONFIG[empresa.rol] || ROL_CONFIG.vendedor;
                        const RolIcon = rolInfo.icon;

                        return (
                            <button
                                key={empresa.empresa_id}
                                onClick={() => selectEmpresa(empresa.empresa_id)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left"
                            >
                                {/* Logo o icono */}
                                {empresa.logo_url ? (
                                    <img
                                        src={empresa.logo_url}
                                        alt={empresa.empresa_nombre}
                                        className="w-12 h-12 rounded-lg object-contain border border-gray-100 bg-gray-50 p-1 shrink-0"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <Building2 size={22} className="text-gray-400" />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{empresa.empresa_nombre}</p>
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${rolInfo.color}`}>
                                        <RolIcon size={11} />
                                        {rolInfo.label}
                                    </span>
                                </div>

                                <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-400 text-center">
                        Podés cambiar de empresa en cualquier momento desde el menú de perfil.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmpresaSelector;

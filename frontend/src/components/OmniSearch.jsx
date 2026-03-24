import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { Search, Loader2, FileText, Package, Users, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const ICON_MAP = {
    'FACTURA': <FileText size={14} className="text-blue-500" />,
    'PRODUCTO': <Package size={14} className="text-emerald-500" />,
    'CLIENTE': <Users size={14} className="text-orange-500" />,
    'PROVEEDOR': <Truck size={14} className="text-purple-500" />
};

export default function OmniSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                setResults(res.data);
            } catch (err) {
                console.error("OmniSearch error:", err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global Hotkey (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
                document.getElementById('omni-search-input')?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (item) => {
        setOpen(false);
        setQuery('');
        // Redirect to exact route based on item tipo
        if(item.ruta) {
             navigate(item.ruta);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative z-50 flex-1 max-w-sm ml-4 lg:ml-8" ref={containerRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </div>
                <input
                    id="omni-search-input"
                    type="text"
                    className="block w-full pl-9 pr-12 py-1.5 border border-slate-200 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-slate-50 hover:bg-white transition-all shadow-sm"
                    placeholder="Buscar facturas, clientes, productos... (Ctrl+K)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                    ) : (
                        <span className="text-[9px] font-black text-slate-300 border border-slate-200 rounded px-1 hidden lg:block">⌘K</span>
                    )}
                </div>
            </div>

            {open && (query.trim().length >= 2) && (
                <div className="absolute mt-2 w-full max-w-md bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden transform opacity-100 scale-100 origin-top">
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                        {loading && results.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 font-medium">Buscando entidades...</div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(item)}
                                        className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors focus:bg-slate-50 focus:outline-none group"
                                    >
                                        <div className="mt-0.5 p-1.5 rounded-md bg-white shadow-sm border border-slate-100 group-hover:border-slate-200">
                                            {ICON_MAP[item.tipo] || <Search size={14} className="text-slate-400" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-800 truncate">{item.nombre}</span>
                                                <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{item.tipo}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{item.extra}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-600">No hay coincidencias</p>
                                <p className="text-[10px] text-slate-400 mt-1">Prueba buscar con otro término</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

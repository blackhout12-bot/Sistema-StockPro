import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowRightLeft, LogOut, FileText, Users as UsersIcon, Building2, Users as CustomersIcon, ShoppingCart, Menu, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from '../components/NotificationsDropdown';

const MainLayout = ({ onLogout }) => {
    const location = useLocation();
    const { user, logout, misEmpresas, switchEmpresa } = useAuth();

    const handleLogout = () => {
        logout();
        if (onLogout) onLogout();
    };

    const currentEmpresaId = user?.empresa_id;
    const currentEmpresa = misEmpresas.find(e => e.empresa_id === currentEmpresaId);

    const baseNavItems = [
        { name: 'Panel', path: '/', icon: <LayoutDashboard size={18} /> },
        { name: 'Productos', path: '/productos', icon: <Package size={18} /> },
        { name: 'Movimientos', path: '/movimientos', icon: <ArrowRightLeft size={18} /> },
        { name: 'Facturación', path: '/facturacion', icon: <ShoppingCart size={18} /> },
        { name: 'Clientes', path: '/clientes', icon: <CustomersIcon size={18} /> },
        { name: 'Reportes', path: '/reportes', icon: <FileText size={18} /> }
    ];

    const navItems = user?.rol === 'admin'
        ? [...baseNavItems,
        { name: 'Usuarios', path: '/usuarios', icon: <UsersIcon size={18} /> },
        { name: 'Auditoría', path: '/auditoria', icon: <History size={18} /> },
        { name: 'Empresa', path: '/empresa', icon: <Building2 size={18} /> }
        ]
        : baseNavItems;

    return (
        <div className="flex h-screen bg-surface-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden md:flex h-full">
                <div className="h-20 flex items-center px-8">
                    <h1 className="text-xl font-extrabold text-primary-600 tracking-tighter">Stock Pro</h1>
                </div>

                {/* Selector de Empresa — Refined */}
                {misEmpresas.length > 1 && (
                    <div className="px-6 py-4">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2 ml-1">
                            Sucursal Activa
                        </label>
                        <div className="relative group">
                            <select
                                value={currentEmpresaId || ''}
                                onChange={(e) => switchEmpresa(Number(e.target.value))}
                                className="w-full appearance-none bg-surface-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer"
                            >
                                {misEmpresas.map(emp => (
                                    <option key={emp.id || emp.empresa_id} value={emp.empresa_id}>
                                        {emp.empresa_nombre}
                                    </option>
                                ))}
                            </select>
                            <Building2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto py-2">
                    <nav className="space-y-1 px-4">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span className={`mr-3 ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                    <div className="flex items-center mb-5 gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-soft">
                            {user?.nombre?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{user?.nombre || user?.email}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{user?.rol || 'Usuario'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all active:scale-95"
                    >
                        <LogOut size={14} className="mr-2" />
                        Finalizar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header Superior Minimalist */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-end px-8 gap-6 sticky top-0 z-40">
                    <div className="flex items-center gap-2 mr-auto md:hidden">
                        <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg font-black text-primary-600 tracking-tighter">Stock Pro</h1>
                    </div>

                    <NotificationsDropdown />

                    <div className="h-6 w-[1.5px] bg-slate-100"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-800 leading-none">{user?.nombre || user?.email}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mt-1">{user?.rol}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-100">
                            {user?.nombre?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};


export default MainLayout;

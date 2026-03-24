import React, { useState, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowRightLeft, LogOut, FileText,
  UsersRound, Building2, Users, ShoppingCart, History, Zap, Bell,
  Store, ChevronRight, ChevronDown, Menu, X, Star, Hammer,
  BarChart2, Settings, List, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import TopBarNotifications from '../components/TopBarNotifications';
import OmniSearch from '../components/OmniSearch';
import moduleRegistry, { getAccessibleModules, groupBySection, sectionMeta } from '../config/moduleRegistry';

// ── Mapa de íconos Lucide ──────────────────────────────────────
const ICON_MAP = {
  LayoutDashboard: <LayoutDashboard size={16} />,
  Package:         <Package size={16} />,
  ArrowRightLeft:  <ArrowRightLeft size={16} />,
  ShoppingCart:    <ShoppingCart size={16} />,
  FileText:        <FileText size={16} />,
  Users:           <Users size={16} />,
  UsersRound:      <UsersRound size={16} />,
  Building2:       <Building2 size={16} />,
  History:         <History size={16} />,
  Zap:             <Zap size={16} />,
  Bell:            <Bell size={16} />,
  Store:           <Store size={16} />,
  Hammer:          <Hammer size={16} />,
  Star:            <Star size={16} />,
  BarChart2:       <BarChart2 size={16} />,
  Settings:        <Settings size={16} />,
  List:            <List size={16} />,
  Receipt:         <Receipt size={16} />
};

// ── Componente de item de nav ──────────────────────────────────
function NavItem({ mod, isActive }) {
  const icon = ICON_MAP[mod.icon] || <Package size={16} />;
  return (
    <Link
      to={mod.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 group ${
        isActive
          ? 'bg-brand-base text-white shadow-sm border border-white/10'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}>
        {icon}
      </span>
      <span className="truncate">{mod.label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
      )}
    </Link>
  );
}

// ── Componente de sección del menú ─────────────────────────────
function NavSection({ sectionKey, mods, currentPath, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = sectionMeta[sectionKey];
  if (!mods || mods.length === 0) return null;

  return (
    <div className="mb-2">
      {meta?.label && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-1.5 mb-1 group"
        >
          <span className="text-[10px] font-black items-center gap-2 text-white/50 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
            {meta.label}
          </span>
          <ChevronDown
            size={12}
            className={`text-white/30 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
        </button>
      )}
      {open && (
        <div className="space-y-0.5 mt-1">
          {mods.map(mod => (
            <NavItem key={mod.id} mod={mod} isActive={
              mod.index ? currentPath === '/' : currentPath === mod.path
            } />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Layout Principal ───────────────────────────────────────────
const MainLayout = () => {
  const { user, logout, misEmpresas, switchEmpresa, featureToggles, empresaConfig } = useAuth();
  const { sucursalActiva, sucursales, selectSucursal } = useBranch();
  const [isMobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentEmpresaId = user?.empresa_id;
  const currentEmpresa = misEmpresas?.find(e => e.empresa_id === currentEmpresaId);

  // ── Módulos accesibles agrupados por sección ─────────────────
  const accessibleModules = useMemo(
    () => getAccessibleModules(featureToggles, user?.rol),
    [featureToggles, user?.rol]
  );
  const grouped = useMemo(() => groupBySection(accessibleModules), [accessibleModules]);

  // Ordenar secciones por order
  const sortedSections = useMemo(
    () => Object.entries(grouped).sort(([a], [b]) => (sectionMeta[a]?.order ?? 99) - (sectionMeta[b]?.order ?? 99)),
    [grouped]
  );

  // ── Breadcrumbs desde el registry ─────────────────────────────
  const generateBreadcrumbs = () => {
    const allMod = moduleRegistry.find(
      m => m.index ? location.pathname === '/' : location.pathname === m.path
    );
    const pathnames = location.pathname.split('/').filter(x => x);

    return (
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-slate-400 font-bold hover:text-primary-600 transition-colors text-xs">
          TB Gestión – Sistema ERP
        </Link>
        {pathnames.length > 0 && (
          <>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-primary-600 font-black text-xs tracking-tight">
              {allMod?.breadcrumb || pathnames[pathnames.length - 1]}
            </span>
          </>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-[10px] font-black">TB</span>
          </div>
          <div>
            <h1 className="text-[14px] font-black text-white tracking-tighter leading-none">TB Gestión</h1>
            {empresaConfig?.rubro && empresaConfig.rubro !== 'general' && (
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider capitalize">
                {empresaConfig.rubro}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selectores removidos y movidos al Header (GestiónMax) */}

      {/* Navegación dinámica por secciones */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {sortedSections.map(([sectionKey, mods]) => (
          <NavSection
            key={sectionKey}
            sectionKey={sectionKey}
            mods={mods}
            currentPath={location.pathname}
            defaultOpen={sectionKey !== 'administracion' && sectionKey !== 'extras'}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0">
            {user?.nombre?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-white truncate">{user?.nombre || user?.email}</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-white/50">{user?.rol || 'Usuario'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black text-white/80 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 uppercase tracking-widest"
        >
          <LogOut size={12} />
          Finalizar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-56 bg-brand-dark border-r border-brand-900 hidden md:flex flex-col h-full flex-shrink-0 shadow-lg z-50 text-white">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-56 bg-brand-dark border-r border-brand-900 z-50 md:hidden flex flex-col transition-transform duration-300 ease-out shadow-xl text-white ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-40 flex-shrink-0">
          {/* Mobile menu trigger */}
          <button
            className="p-2 text-slate-400 hover:text-primary-600 transition-colors md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* FASE 4: Breadcrumbs y Context Selectors (GestiónMax) */}
          <div className="hidden md:flex items-center gap-4 flex-1 ml-4 lg:ml-8 border-l border-slate-200 pl-4 lg:pl-8">
            {generateBreadcrumbs()}
            
            <div className="h-4 w-px bg-slate-200 mx-2" />

            {misEmpresas?.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 hover:border-brand-300 transition-colors">
                <Building2 size={12} className="text-brand-base" />
                <select
                  value={currentEmpresaId || ''}
                  onChange={(e) => switchEmpresa(Number(e.target.value))}
                  className="appearance-none bg-transparent border-none text-[11px] font-black text-slate-700 outline-none cursor-pointer pr-4 uppercase tracking-widest"
                >
                  {misEmpresas?.map(emp => (
                    <option key={emp.id || emp.empresa_id} value={emp.empresa_id}>{emp.empresa_nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {sucursales.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 hover:border-brand-300 transition-colors">
                <Store size={12} className="text-brand-base" />
                <select
                  value={sucursalActiva?.id || ''}
                  onChange={(e) => {
                    const s = sucursales.find(s => s.id === Number(e.target.value));
                    if (s) selectSucursal(s);
                  }}
                  className="appearance-none bg-transparent border-none text-[11px] font-black text-slate-700 outline-none cursor-pointer pr-4 uppercase tracking-widest"
                >
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">
            <OmniSearch />
            <TopBarNotifications />
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold text-slate-800 leading-none">{user?.nombre || user?.email}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary-500 mt-0.5">{user?.rol}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-100">
                {user?.nombre?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

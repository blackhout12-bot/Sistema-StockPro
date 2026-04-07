/**
 * moduleRegistry.js
 * ─────────────────────────────────────────────────────────────────
 * Fuente de verdad de TODOS los módulos del sistema.
 * Para agregar un módulo nuevo: solo agregar una entrada aquí.
 * El router y el menú se construyen automáticamente desde este archivo.
 *
 * Estructura de cada módulo:
 *   id            - identificador único (string)
 *   label         - nombre visible en el menú
 *   path          - ruta React Router (relativa a "/")
 *   icon          - nombre del ícono de lucide-react
 *   section       - sección del menú: operaciones | relaciones | analitica | administracion | extras
 *   requiredToggle - key del featureToggle requerido (null = siempre visible si el rol lo permite)
 *   requiredRoles  - array de roles autorizados ('*' = todos)
 *   lazy          - función de import dinámico del componente
 *   breadcrumb    - nombre para breadcrumbs (opcional, usa label si no)
 */

const moduleRegistry = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    section: 'core',
    requiredToggle: null,
    requiredRoles: ['*'],
    lazy: () => import('../pages/Dashboard'),
    breadcrumb: 'Dashboard',
    index: true
  },
  {
    id: 'notificaciones-panel',
    label: 'Notificaciones',
    path: '/notificaciones',
    icon: 'Bell',
    section: 'core',
    requiredToggle: null,
    requiredRoles: ['*'],
    lazy: () => import('../pages/NotificationsPanel'),
    breadcrumb: 'Bandeja de Notificaciones'
  },

  // ── OPERACIONES ────────────────────────────────────────────────
  {
    id: 'facturacion',
    label: 'Facturación / POS',
    path: '/facturacion',
    icon: 'Receipt',
    section: 'operaciones',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente', 'cajero', 'supervisor'],
    lazy: () => import('../pages/Facturacion'),
    breadcrumb: 'Punto de Venta'
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    path: '/movimientos',
    icon: 'ArrowRightLeft',
    section: 'operaciones',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente', 'supervisor'],
    lazy: () => import('../pages/Movements'),
    breadcrumb: 'Movimientos de Stock'
  },
  {
    id: 'productos',
    label: 'Productos',
    path: '/productos',
    icon: 'Package',
    section: 'operaciones',
    requiredToggle: null,
    lazy: () => import('../pages/Products'),
    breadcrumb: 'Catálogo de Productos'
  },
  {
    id: 'categorias',
    label: 'Categorías',
    path: '/categorias',
    icon: 'List', // List component from lucide
    section: 'operaciones',
    requiredToggle: null,
    lazy: () => import('../pages/Categorias'),
    breadcrumb: 'Categorías de Productos'
  },
  {
    id: 'compras',
    label: 'Compras',
    path: '/compras',
    icon: 'ShoppingCart',
    section: 'operaciones',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/Compras'),
    breadcrumb: 'Gestión de Compras'
  },

  // ── RELACIONES ─────────────────────────────────────────────────
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: 'Users',
    section: 'relaciones',
    requiredToggle: null,
    lazy: () => import('../pages/Clientes'),
    breadcrumb: 'Clientes'
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    path: '/proveedores',
    icon: 'Truck',
    section: 'relaciones',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente', 'supervisor'],
    lazy: () => import('../pages/Proveedores'),
    breadcrumb: 'Proveedores'
  },

  // ── ANALÍTICA ──────────────────────────────────────────────────
  {
    id: 'reportes',
    label: 'Reportes',
    path: '/reportes',
    icon: 'FileText',
    section: 'analitica',
    requiredToggle: null,
    lazy: () => import('../pages/Reports'),
    breadcrumb: 'Reportes y Analytics'
  },
  {
    id: 'kardex',
    label: 'Kardex (Inventario)',
    path: '/kardex',
    icon: 'ClipboardList',
    section: 'analitica',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/Kardex'),
    breadcrumb: 'Kardex Valorizado'
  },
  {
    id: 'cuentas-cobrar',
    label: 'Cuentas por Cobrar',
    path: '/cuentas-cobrar',
    icon: 'Briefcase',
    section: 'analitica',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/CuentasCobrar'),
    breadcrumb: 'Cuentas por Cobrar (Deudores)'
  },
  {
    id: 'cuentas-pagar',
    label: 'Cuentas por Pagar',
    path: '/cuentas-pagar',
    icon: 'Landmark',
    section: 'analitica',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/CuentasPagar'),
    breadcrumb: 'Cuentas por Pagar (Acreedores)'
  },

  // ── ADMINISTRACIÓN ────────────────────────────────────────────
  {
    id: 'usuarios',
    label: 'Usuarios',
    path: '/usuarios',
    icon: 'UsersRound',
    section: 'administracion',
    requiredToggle: null,
    requiredRoles: ['admin'],
    lazy: () => import('../pages/Users'),
    breadcrumb: 'Gestión de Usuarios'
  },
  {
    id: 'empresa',
    label: 'Mi Empresa',
    path: '/empresa',
    icon: 'Building2',
    section: 'administracion',
    requiredToggle: null,
    requiredRoles: ['admin'],
    lazy: () => import('../pages/Empresa'),
    breadcrumb: 'Configuración de Empresa'
  },
  {
    id: 'sucursales',
    label: 'Sucursales',
    path: '/sucursales',
    icon: 'MapPin',
    section: 'administracion',
    requiredToggle: null,
    requiredRoles: ['admin'],
    lazy: () => import('../pages/Sucursales'),
    breadcrumb: 'Gestión de Sucursales'
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    path: '/auditoria',
    icon: 'History',
    section: 'administracion',
    requiredToggle: null,
    requiredRoles: ['admin'],
    lazy: () => import('../pages/AuditLogs'),
    breadcrumb: 'Logs de Auditoría'
  },
  {
    id: 'delegaciones',
    label: 'Delegación de Poderes',
    path: '/delegaciones',
    icon: 'Shield',
    section: 'administracion',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/Delegaciones'),
    breadcrumb: 'Préstamo Temprano de Roles'
  },

  // ── EXTRAS (requieren feature toggles) ───────────────────────
  {
    id: 'pagos-externos',
    label: 'Integraciones',
    path: '/pagos-externos',
    icon: 'Zap',
    section: 'extras',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/PaymentsDashboard'),
    breadcrumb: 'Integraciones de Pago'
  },
  {
    id: 'alertas-ia',
    label: 'Alertas & IA',
    path: '/alertas-ia',
    icon: 'Bell',
    section: 'extras',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/AlertsPanel'),
    breadcrumb: 'Alertas e Inteligencia Artificial'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    path: '/marketplace',
    icon: 'Store',
    section: 'extras',
    requiredToggle: 'mod_marketplace',
    requiredRoles: ['admin', 'gerente'],
    lazy: () => import('../pages/Marketplace'),
    breadcrumb: 'Marketplace'
  },
  {
    id: 'produccion',
    label: 'Producción',
    path: '/produccion',
    icon: 'Hammer',
    section: 'extras',
    requiredToggle: 'mod_produccion',
    requiredRoles: ['admin', 'gerente', 'supervisor'],
    lazy: () => import('../pages/Movements'), // reusa Movements con contexto de producción
    breadcrumb: 'Órdenes de Producción'
  },
  {
    id: 'fidelizacion',
    label: 'Fidelización',
    path: '/fidelizacion',
    icon: 'Star',
    section: 'extras',
    requiredToggle: 'mod_fidelizacion',
    requiredRoles: ['admin', 'gerente', 'supervisor'],
    lazy: () => import('../pages/Clientes'), // reusa Clientes con contexto VIP
    breadcrumb: 'Programa de Fidelización'
  },

  // ── SUPERADMIN (Solo visible para rol superadmin) ───────────────────────
  {
    id: 'superadmin',
    label: 'Panel SuperAdmin',
    path: '/superadmin',
    icon: 'ShieldAlert',
    section: 'administracion',
    requiredToggle: null,
    requiredRoles: ['superadmin'],
    lazy: () => import('../pages/SuperAdminPanel'),
    breadcrumb: 'Panel SuperAdministrador'
  }
];

export default moduleRegistry;

/**
 * Helpers de filtrado
 */

/**
 * Filtra el registry según featureToggles y rol del usuario. (v1.28.1-fixed)
 * @param {object} featureToggles - Contiene los módulos habilitados por el Plan
 * @param {string} userRole
 * @returns {Array} módulos accesibles
 */
export function getAccessibleModules(featureToggles = {}, userRole = '') {
  const toggles = featureToggles || {};

  // SUPERADMIN: acceso total a todos los módulos de la plataforma
  if (userRole === 'superadmin') {
    return moduleRegistry.filter(mod => mod.requiredRoles?.includes('superadmin') || mod.requiredRoles?.includes('*') || mod.section === 'core');
  }

  return moduleRegistry.filter(mod => {
    // Excluir módulos exclusivos de superadmin para otros roles
    if (mod.requiredRoles?.length === 1 && mod.requiredRoles[0] === 'superadmin') return false;

    // 1. Módulos Core/Administración Básica siempre visibles
    const isCore = mod.section === 'core' || mod.id === 'empresa' || mod.id === 'usuarios';

    // 2. Si no es core, debe estar habilitado en el Plan (toggles)
    if (!isCore && !toggles[mod.id]) {
        // Excepción: Si el módulo tiene un toggle específico (ej: mod_marketplace)
        if (mod.requiredToggle && toggles[mod.requiredToggle]) return true;
        return false;
    }

    // 3. Verificar Rol
    const roles = mod.requiredRoles || ['*'];
    if (roles.includes('*')) return true;
    return roles.includes(userRole);
  });
}

/**
 * Agrupa los módulos accesibles por sección.
 * @param {Array} accessibleModules
 * @returns {object} mapa { sección: [módulos] }
 */
export function groupBySection(accessibleModules) {
  return accessibleModules.reduce((acc, mod) => {
    if (!acc[mod.section]) acc[mod.section] = [];
    acc[mod.section].push(mod);
    return acc;
  }, {});
}

/**
 * Metadata de secciones (orden y labels)
 */
export const sectionMeta = {
  core:           { label: null,              order: 0 }, // no muestra título
  operaciones:    { label: 'Operaciones',     order: 1 },
  relaciones:     { label: 'Relaciones',      order: 2 },
  analitica:      { label: 'Analítica',       order: 3 },
  administracion: { label: 'Administración',  order: 4 },
  extras:         { label: 'Extras',          order: 5 }
};

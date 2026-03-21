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
  // ── CORE — siempre disponible ─────────────────────────────────
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

  // ── OPERACIONES ────────────────────────────────────────────────
  {
    id: 'facturacion',
    label: 'Facturación / POS',
    path: '/facturacion',
    icon: 'ShoppingCart',
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
    requiredRoles: ['admin', 'gerente', 'supervisor'],
    lazy: () => import('../pages/Products'),
    breadcrumb: 'Catálogo de Productos'
  },

  // ── RELACIONES ─────────────────────────────────────────────────
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: 'Users',
    section: 'relaciones',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente', 'supervisor', 'cajero'],
    lazy: () => import('../pages/Clientes'),
    breadcrumb: 'Clientes'
  },

  // ── ANALÍTICA ──────────────────────────────────────────────────
  {
    id: 'reportes',
    label: 'Reportes',
    path: '/reportes',
    icon: 'FileText',
    section: 'analitica',
    requiredToggle: null,
    requiredRoles: ['admin', 'gerente', 'supervisor'],
    lazy: () => import('../pages/Reports'),
    breadcrumb: 'Reportes y Analytics'
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
  }
];

export default moduleRegistry;

/**
 * Helpers de filtrado
 */

/**
 * Filtra el registry según featureToggles y rol del usuario.
 * @param {object} featureToggles
 * @param {string} userRole
 * @returns {Array} módulos accesibles
 */
export function getAccessibleModules(featureToggles = {}, userRole = '') {
  return moduleRegistry.filter(mod => {
    // Verificar toggle requerido
    if (mod.requiredToggle && !featureToggles[mod.requiredToggle]) return false;
    // Verificar rol
    if (mod.requiredRoles.includes('*')) return true;
    return mod.requiredRoles.includes(userRole);
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

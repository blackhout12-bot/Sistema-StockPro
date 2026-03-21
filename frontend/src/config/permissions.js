/**
 * permissions.js
 * ─────────────────────────────────────────────────────────────────
 * Tabla centralizada de permisos por rol.
 * Define qué acciones puede realizar cada rol dentro de un módulo.
 *
 * Uso:
 *   import { can } from '../config/permissions';
 *   if (can(user.rol, 'facturacion', 'create')) { ... }
 */

/**
 * Matriz de permisos: rol → módulo → acciones
 * Acciones posibles: 'read', 'create', 'update', 'delete', 'export'
 */
const permissionsMatrix = {
  admin: {
    '*': ['read', 'create', 'update', 'delete', 'export'] // acceso total
  },
  gerente: {
    dashboard:      ['read'],
    facturacion:    ['read', 'create', 'export'],
    movimientos:    ['read', 'create', 'update', 'export'],
    productos:      ['read', 'create', 'update', 'export'],
    clientes:       ['read', 'create', 'update', 'export'],
    reportes:       ['read', 'export'],
    'pagos-externos': ['read'],
    'alertas-ia':   ['read'],
    marketplace:    ['read', 'create', 'update'],
    produccion:     ['read', 'create', 'update'],
    fidelizacion:   ['read', 'create', 'update']
  },
  supervisor: {
    dashboard:      ['read'],
    facturacion:    ['read', 'create'],
    movimientos:    ['read', 'create', 'update'],
    productos:      ['read', 'create', 'update'],
    clientes:       ['read', 'create', 'update'],
    reportes:       ['read'],
    produccion:     ['read', 'create'],
    fidelizacion:   ['read', 'update']
  },
  cajero: {
    dashboard:      ['read'],
    facturacion:    ['read', 'create'],
    clientes:       ['read', 'create'],
    movimientos:    ['read']
  },
  gestor_produccion: {
    dashboard:      ['read'],
    movimientos:    ['read', 'create', 'update'],
    productos:      ['read', 'update'],
    produccion:     ['read', 'create', 'update', 'delete']
  },
  gestor_fidelizacion: {
    dashboard:      ['read'],
    clientes:       ['read', 'update'],
    fidelizacion:   ['read', 'create', 'update']
  }
};

/**
 * Verifica si un rol tiene permiso para una acción en un módulo.
 * @param {string} rol
 * @param {string} modulo
 * @param {string} accion
 * @returns {boolean}
 */
export function can(rol, modulo, accion) {
  if (!rol) return false;
  const rolPerms = permissionsMatrix[rol];
  if (!rolPerms) return false;
  // Admin con wildcard
  if (rolPerms['*']) return rolPerms['*'].includes(accion);
  const moduloPerms = rolPerms[modulo];
  if (!moduloPerms) return false;
  return moduloPerms.includes(accion);
}

/**
 * Retorna todas las acciones disponibles para un rol en un módulo.
 * @param {string} rol
 * @param {string} modulo
 * @returns {string[]}
 */
export function getActions(rol, modulo) {
  if (!rol) return [];
  const rolPerms = permissionsMatrix[rol];
  if (!rolPerms) return [];
  if (rolPerms['*']) return rolPerms['*'];
  return rolPerms[modulo] || [];
}

/**
 * Hook de conveniencia para usar en componentes React.
 * @example
 *   const { can } = usePermissions();
 *   {can('facturacion', 'create') && <button>Nueva Venta</button>}
 */
export function usePermissions() {
  // Importado lazy para evitar dependencia circular con useAuth
  // eslint-disable-next-line
  const { user } = require('../context/AuthContext').useAuth
    ? require('../context/AuthContext').useAuth()
    : { user: null };

  return {
    can: (modulo, accion) => can(user?.rol, modulo, accion),
    getActions: (modulo) => getActions(user?.rol, modulo)
  };
}

export default permissionsMatrix;

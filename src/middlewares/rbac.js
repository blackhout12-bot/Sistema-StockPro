const { verificarPermisoRol } = require('../repositories/auth.repository');

/**
 * Middleware Factory para Control de Acceso Basado en Roles (RBAC)
 * Verifica si el usuario actual tiene el permiso requerido para un recurso dado.
 *
 * @param {string} recurso Ej: 'productos', 'facturacion', 'clientes'
 * @param {string} accion  Ej: 'crear', 'leer', 'editar', 'eliminar'
 * @returns Express Middleware
 */
const checkPermiso = (recurso, accion) => {
    return async (req, res, next) => {
        // BYPASS: No validar permisos en health checks
        if (req.path.endsWith('/health') || req.path.endsWith('/ready') || req.path === '/ping') {
            return next();
        }

        try {
            // 1. Asegurar que tenemos perfil de usuario autenticado
            if (!req.user || !req.user.rol) {
                return res.status(401).json({ error: 'No autorizado. Falta token válido.' });
            }

            const rolUsuario = req.user.rol; // 'admin' o 'vendedor'
            const empresa_id = req.tenant_id || req.user.empresa_id;

            // 2. Consultar la Base de Datos para verificar acceso real en la tabla Roles
            const tieneAcceso = await verificarPermisoRol(empresa_id, rolUsuario, recurso, accion);

            // 3. Ejecutar política de Drop seguro por defecto
            if (!tieneAcceso) {
                req.log.warn({
                    msg: 'Intento de acceso denegado por RBAC',
                    rol: rolUsuario,
                    recurso,
                    accion,
                    ip: req.ip
                });
                return res.status(403).json({
                    error: `Acceso denegado: Se requiere el permiso [${recurso}:${accion}] para esta operación.`
                });
            }

            // Si tiene acceso, permitir que continúe
            next();
        } catch (err) {
            req.log.error({ err, msg: 'Error de validación RBAC' });
            return res.status(500).json({ error: 'Error interno validando permisos.' });
        }
    };
};

module.exports = checkPermiso;

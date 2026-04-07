const { obtenerMembresia, obtenerPlanEmpresa } = require('../repositories/auth.repository');

/**
 * Middleware para asegurar y validar el contexto del tenant (empresa).
 * Evita fugas de datos al validar que el usuario tenga acceso a la empresa solicitada.
 * Además, valida que el módulo solicitado esté habilitado en el PLAN contratado. (v1.28.1-fixed)
 */
async function tenantContext(req, res, next) {
    // BYPASS: No validar contexto en health checks
    if (req.path.endsWith('/health') || req.path.endsWith('/ready') || req.path === '/ping') {
        return next();
    }

    try {
        const headerEmpresaId = req.headers['x-empresa-id'];
        const queryEmpresaId = req.query.empresa_id || (req.body && req.body.empresa_id);
        const jwtEmpresaId = req.user.empresa_id;

        let selectedId = headerEmpresaId ? parseInt(headerEmpresaId) : (queryEmpresaId ? parseInt(queryEmpresaId) : jwtEmpresaId);

        if (!selectedId || isNaN(selectedId)) {
            return res.status(400).json({ error: 'Contexto de empresa (empresa_id) inválido o faltante.' });
        }

        // 1. VALIDACIÓN DE PERTENENCIA: ¿Tiene el usuario acceso real a esta empresa?
        const membresia = await obtenerMembresia(req.user.id, selectedId);

        if (!membresia || !membresia.activo) {
            req.log.warn({ msg: 'Intento de acceso a empresa no autorizada', userId: req.user.id, requestedEmpresaId: selectedId });
            return res.status(403).json({ error: 'No tienes permiso para acceder a los datos de esta empresa.' });
        }

        // 2. VALIDACIÓN DE PLAN: ¿Está el módulo habilitado en el plan? (v1.28.1-fixed)
        // Extraemos el módulo de la ruta (e.g., /api/v1/facturacion/... -> facturacion)
        const pathParts = req.path.split('/');
        const moduleName = pathParts[3]; // [ "", "api", "v1", "modulo" ]

        // Módulos "Core" que siempre están activos
        const coreModules = ['auth', 'empresa', 'dashboard', 'notificaciones', 'perfil', 'configuracion'];

        if (moduleName && !coreModules.includes(moduleName)) {
            const plan = await obtenerPlanEmpresa(selectedId);
            if (plan && plan.modulos) {
                const isEnterprise = plan.modulos['*'] === true;
                const isAllowed = plan.modulos[moduleName] === true;

                if (!isEnterprise && !isAllowed) {
                    req.log.warn({ msg: 'Acceso denegado por Plan', module: moduleName, plan: plan.nombre, empresaId: selectedId });
                    return res.status(403).json({
                        error: `El módulo '${moduleName}' no está incluido en su plan actual (${plan.nombre}). Contacte a soporte para actualizar su plan.`
                    });
                }
            }
        }

        // Establecer el contexto seguro
        req.tenant_id = selectedId;
        req.log.info({ userId: req.user.id, tenantId: selectedId, path: req.path }, 'Tenant Context Establecido');
        req.user.rol = membresia.rol;

        next();
    } catch (err) {
        req.log.error({ err, msg: 'Error de validación de contexto de tenant' });
        return res.status(500).json({ error: 'Error interno validando contexto de empresa.' });
    }
}

module.exports = tenantContext;

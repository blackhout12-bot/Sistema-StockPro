// src/middlewares/tenantContext.js
const { obtenerMembresia, obtenerPlanEmpresa } = require('../repositories/auth.repository');

/**
 * Middleware para asegurar y validar el contexto del tenant (empresa).
 * Evita fugas de datos al validar que el usuario tenga acceso a la empresa solicitada.
 * Instrumentado v1.28.1: Validación de Activación/Desactivación de Módulos por Plan.
 */
async function tenantContext(req, res, next) {
    // BYPASS: No validar contexto en health checks
    if (req.path.endsWith('/health') || req.path.endsWith('/ready') || req.path === '/ping') {
        return next();
    }

    const { user } = req;

    // Bypass inmediato para superadmin (v1.28.2-superadmin-panel-restore-apply)
    if (user && (user.role === 'superadmin' || user.rol === 'superadmin')) {
        req.tenant_id = null; // Mantenemos para compatibilidad con el resto del archivo
        req.empresaId = null;
        req.planId = 'FULL';
        req.featureToggles = ['*'];
        req.panel = 'global'; // habilitar panel global
        return next();
    }

    try {
        // PRIORIDAD 1: Header explícito (usado por el frontend para cambiar de empresa)
        const headerEmpresaId = req.headers['x-empresa-id'];

        // PRIORIDAD 1.5: Query param explícito o Body param (usado para descargas directas)
        const queryEmpresaId = req.query.empresa_id || (req.body && req.body.empresa_id);

        // PRIORIDAD 2: El empresa_id por defecto que viene en el JWT
        const jwtEmpresaId = req.user.empresa_id;

        let selectedId = headerEmpresaId ? parseInt(headerEmpresaId) : (queryEmpresaId ? parseInt(queryEmpresaId) : jwtEmpresaId);

        if (!selectedId || isNaN(selectedId)) {
            return res.status(400).json({ error: 'Contexto de empresa (empresa_id) inválido o faltante.' });
        }

        // VALIDACIÓN DE SEGURIDAD: ¿Tiene el usuario acceso real a esta empresa?
        const membresia = await obtenerMembresia(req.user.id, selectedId);

        if (!membresia || !membresia.activo) {
            req.log.warn({
                msg: 'Intento de acceso a empresa no autorizada',
                userId: req.user.id,
                requestedEmpresaId: selectedId,
                ip: req.ip
            });
            return res.status(403).json({
                error: 'No tienes permiso para acceder a los datos de esta empresa.'
            });
        }

        // ─── VALIDACIÓN DE PLAN (v1.28.1) ───────────────────────────────────
        const planInfo = await obtenerPlanEmpresa(selectedId);
        if (planInfo) {
            const modulos = planInfo.modulos || {};
            
            // Si el plan no tiene wildcard total, validamos el recurso solicitado
            if (!modulos['*']) {
                // Extraer el módulo del originalUrl (ej: /api/v1/facturacion/... -> facturacion)
                const pathParts = req.originalUrl.split('/');
                // Buscamos el segmento después de v1 o v2
                const vIndex = pathParts.findIndex(p => p === 'v1' || p === 'v2');
                const requestedModule = vIndex !== -1 ? pathParts[vIndex + 1] : null;

                // Módulos "core" que siempre están permitidos
                const coreModules = ['auth', 'empresa', 'notificaciones', 'contextos', 'search', 'telemetry', 'ping'];

                if (requestedModule && !coreModules.includes(requestedModule)) {
                    if (!modulos[requestedModule]) {
                        req.log.warn({
                            msg: 'Intento de acceso a módulo no contratado',
                            userId: req.user.id,
                            tenantId: selectedId,
                            module: requestedModule,
                            plan: planInfo.nombre
                        });
                        return res.status(403).json({
                            error: `El módulo '${requestedModule}' no está incluido en su plan actual (${planInfo.nombre}).`
                        });
                    }
                }
            }
        }

        // Establecer el contexto seguro para el resto de la ejecución
        req.tenant_id = selectedId;
        req.plan = planInfo; // Adjuntar info del plan al request
        req.log.info({ userId: req.user.id, tenantId: selectedId, path: req.path }, 'Tenant Context Establecido');
        req.user.rol = membresia.rol; 

        next();
    } catch (err) {
        req.log.error({ err, msg: 'Error de validación de contexto de tenant/plan' });
        return res.status(500).json({ error: 'Error interno validando contexto de empresa.' });
    }
}

module.exports = tenantContext;

const { obtenerMembresia, obtenerPlanEmpresa } = require('../repositories/auth.repository');
const { connectDB, sql } = require('../config/db');
const { getCache, setCache } = require('../config/redis');
const fs = require('fs');
const path = require('path');

/**
 * Logger simple para auditoría de seguridad
 */
const securityLogger = (msg) => {
    const logPath = path.join(process.cwd(), 'logs', 'security.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
};

/**
 * Middleware para asegurar y validar el contexto del tenant (empresa).
 *
 * Estratificación de acceso (v1.28.2-superadmin-plan-sync):
 *   - superadmin → bypass total (acceso global a toda la plataforma, sin restricciones)
 *   - admin       → validar empresa + plan habilitado (con caching optimizado)
 *   - otros roles → validar empresa + plan + permisos RBAC
 */
async function tenantContext(req, res, next) {
    // BYPASS: No validar contexto en health checks
    if (req.path.endsWith('/health') || req.path.endsWith('/ready') || req.path === '/ping') {
        return next();
    }

    try {
        // ─── SUPERADMIN BYPASS ────────────────────────────────────────────
        if (req.user && req.user.rol === 'superadmin') {
            const headerEmpresaId = req.headers['x-empresa-id'];
            const queryEmpresaId = req.query.empresa_id || (req.body && req.body.empresa_id);
            const contextEmpresaId = headerEmpresaId || queryEmpresaId;

            if (contextEmpresaId && !isNaN(parseInt(contextEmpresaId))) {
                req.tenant_id = parseInt(contextEmpresaId);
                const pool = await connectDB();
                await pool.request()
                    .input('eid', sql.Int, req.tenant_id)
                    .query('EXEC sp_set_session_context @key=N\'empresa_id\', @value=@eid');
            }

            req.is_superadmin = true;
            return next();
        }

        // ─── FLUJO NORMAL (admin / operadores) ───────────────────────────
        const headerEmpresaId = req.headers['x-empresa-id'];
        const queryEmpresaId = req.query.empresa_id || (req.body && req.body.empresa_id);
        const jwtEmpresaId = req.user.empresa_id;

        let selectedId = headerEmpresaId ? parseInt(headerEmpresaId) : (queryEmpresaId ? parseInt(queryEmpresaId) : jwtEmpresaId);

        if (!selectedId || isNaN(selectedId)) {
            return res.status(400).json({ error: 'Contexto de empresa (empresa_id) inválido o faltante.' });
        }

        // 1. VALIDACIÓN DE PERTENENCIA
        const membresia = await obtenerMembresia(req.user.id, selectedId);

        if (!membresia || !membresia.activo) {
            securityLogger(`INTENTO DE ACCESO CRUZADO: Usuario ${req.user.id} intentó acceder a Empresa ${selectedId} desde IP ${req.ip}`);
            return res.status(403).json({ error: 'No tienes permiso para acceder a los datos de esta empresa.' });
        }

        // 2. ACTIVACIÓN DE AISLAMIENTO (RLS)
        const pool = await connectDB();
        await pool.request()
            .input('eid', sql.Int, selectedId)
            .query('EXEC sp_set_session_context @key=N\'empresa_id\', @value=@eid');

        // 3. VALIDACIÓN DE PLAN (v1.28.2 - Caching optimizado)
        const pathParts = req.path.split('/');
        const moduleName = pathParts[3];

        const coreModules = ['auth', 'empresa', 'dashboard', 'notificaciones', 'perfil', 'configuracion', 'superadmin'];

        if (moduleName && !coreModules.includes(moduleName)) {
            // Intentar obtener de cache
            const cacheKey = `empresa:plan:${selectedId}`;
            let plan = await getCache(cacheKey);
            
            if (!plan) {
                plan = await obtenerPlanEmpresa(selectedId);
                if (plan) {
                    await setCache(cacheKey, plan, 300); // 5 min TTL
                }
            }

            if (plan && plan.modulos) {
                const isEnterprise = plan.modulos['*'] === true;
                const isAllowed = plan.modulos[moduleName] === true;

                if (!isEnterprise && !isAllowed) {
                    securityLogger(`ACCESO DENEGADO PLAN: Usuario ${req.user.id} intentó acceder a Módulo ${moduleName} (No incluido en plan ${plan.nombre})`);
                    return res.status(403).json({
                        error: `El módulo '${moduleName}' no está incluido en su plan actual (${plan.nombre}). Contacte a soporte para actualizar su plan.`
                    });
                }
            }
        }

        // Establecer el contexto seguro
        req.tenant_id = selectedId;
        req.user.rol = membresia.rol;

        next();
    } catch (err) {
        if (req.log) req.log.error({ err, msg: 'Error de validación de contexto de tenant' });
        else console.error('Error de validación de contexto:', err);
        return res.status(500).json({ error: 'Error interno validando contexto de empresa.' });
    }
}

module.exports = tenantContext;


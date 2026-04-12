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
    try {
        const user = req.user;

        // ─── BYPASS EXPLÍCITO PARA SUPERADMIN (v1.28.2) ─────────────────────
        if (user && user.rol === 'superadmin') {
            req.empresa_id = null;
            req.tenant_id = null;
            req.planId = 'FULL';
            req.featureToggles = ['*']; // Acceso total
            req.is_superadmin = true;
            return next();
        }

        // Validaciones para admin y user
        if (!user || !user.empresa_id) {
            return res.status(403).json({ 
                error: 'No tenés permisos para realizar esta acción.',
                message: 'No se detectó un contexto de empresa válido.' 
            });
        }

        // BYPASS secundarios: health checks
        if (req.path.endsWith('/health') || req.path.endsWith('/ready') || req.path === '/ping') {
            return next();
        }

        // ─── CONSULTA DIRECTA DEL PLAN (Sin cache persistente) ──────────────
        const selectedId = user.empresa_id;
        const plan = await obtenerPlanEmpresa(selectedId);

        if (!plan) {
            return res.status(403).json({ error: 'La empresa no tiene un plan activo asignado.' });
        }

        // Establecer contexto en el request
        req.tenant_id = selectedId;
        req.empresa_id = selectedId; // Alias para compatibilidad
        req.planId = plan.id;
        req.featureToggles = plan.modulos || {};

        // 2. ACTIVACIÓN DE AISLAMIENTO (RLS)
        const pool = await connectDB();
        await pool.request()
            .input('eid', sql.Int, selectedId)
            .query('EXEC sp_set_session_context @key=N\'empresa_id\', @value=@eid');

        // 3. VALIDACIÓN DE PERMISOS DE MÓDULO (RBAC granular)
        const pathParts = req.path.split('/');
        const moduleName = pathParts[3]; // ej: /api/v1/productos -> productos
        
        const coreModules = ['auth', 'empresa', 'dashboard', 'notificaciones', 'perfil', 'configuracion', 'superadmin'];

        if (moduleName && !coreModules.includes(moduleName) && plan.modulos) {
            const isEnterprise = plan.modulos['*'] === true;
            const isAllowed = plan.modulos[moduleName] === true;

            if (!isEnterprise && !isAllowed) {
                securityLogger(`ACCESO DENEGADO PLAN: Usuario ${user.id} intentó acceder a Módulo ${moduleName} (No incluido en plan ${plan.nombre})`);
                return res.status(403).json({
                    error: `El módulo '${moduleName}' no está incluido en su plan actual (${plan.nombre}). Contacte a soporte para actualizar su plan.`
                });
            }
        }

        next();
    } catch (err) {
        if (req.log) req.log.error({ err, msg: 'Error de validación de contexto de tenant' });
        else console.error('Error de validación de contexto:', err);
        return res.status(500).json({ error: 'Error interno validando contexto de empresa.' });
    }
}

module.exports = tenantContext;


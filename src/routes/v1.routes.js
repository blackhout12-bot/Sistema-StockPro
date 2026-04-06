// src/routes/v1.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../config/db');
const { redisClient, getRedisStatus } = require('../config/redis');
const rabbitMQ = require('../config/rabbitmq');
const { webVitalsSummary } = require('../middlewares/metrics');

// Limiter para Auth (Desactivado para Debug)
const authLimiter = (req, res, next) => next();

// --- Definición de Rutas V1 ---

// Middleware para omitir auth en health checks
const sessionBypass = (req, res, next) => {
    if (req.path.endsWith('/health') || req.path.endsWith('/ready') || req.path === '/ping') {
        return next();
    }
    authenticate(req, res, next);
};

router.get('/ping', async (req, res) => {
    try {
        const health = {
            status: 'Healthy',
            version: 'v1',
            timestamp: new Date().toISOString(),
            checks: {}
        };

        // 1. Database Check
        const pool = await connectDB();
        await pool.query('SELECT 1 as is_alive');
        health.checks.database = 'OK';

        // 2. Redis Check
        if (getRedisStatus() === 'OK') {
            await redisClient.ping();
            health.checks.redis = 'OK';
        } else {
            throw new Error(`Redis status is ${getRedisStatus()}`);
        }

        // 3. RabbitMQ Check
        if (rabbitMQ.connection && rabbitMQ.channel) {
            health.checks.rabbitmq = 'OK';
        } else {
            throw new Error('RabbitMQ channel not open');
        }

        res.json(health);
    } catch (error) {
        if (req.log) req.log.error({ err: error.message }, 'Liveness probe failed');
        else console.error('Liveness probe failed:', error.message);
        
        res.status(503).json({
            status: 'Unhealthy',
            version: 'v1',
            error: error.message
        });
    }
});

// Telemetría Frontend (Web Vitals)
router.post('/telemetry/vitals', express.json(), (req, res) => {
    try {
        const metric = req.body;
        const parsed = typeof metric === 'string' ? JSON.parse(metric) : metric;
        if (parsed && parsed.name && typeof parsed.value === 'number') {
            webVitalsSummary.labels(parsed.name).observe(parsed.value);
        }
    } catch(e) {}
    res.status(204).end();
});

// Públicas (Auth)
router.use('/auth', authLimiter, require('../modules/auth/auth.controller'));
router.use('/auth/sso', authLimiter, require('../modules/auth/auth_sso.controller'));

// Protegidas (Requieren Auth y Tenant Context)
router.use('/notificaciones', sessionBypass, tenantContext, require('../modules/notificaciones/notificaciones.controller'));
router.use('/facturacion', sessionBypass, tenantContext, require('../modules/facturacion/facturacion.controller'));
router.use('/search', sessionBypass, tenantContext, require('../modules/search/search.controller'));

router.use('/pos', sessionBypass, tenantContext, require('../modules/pos/pos.controller'));
router.use('/payments', sessionBypass, require('../modules/payments/payments.controller'));
router.use('/importacion', sessionBypass, tenantContext, require('../modules/importacion/importacion.controller'));
router.use('/monedas', sessionBypass, require('../modules/configuracion/monedas.controller'));
router.use('/contextos', sessionBypass, tenantContext, require('../modules/contextos/contextos.controller'));
router.use('/categorias', sessionBypass, tenantContext, require('../modules/categorias/categorias.controller'));
router.use('/productos', sessionBypass, tenantContext, require('../modules/productos/productos.controller'));
router.use('/clientes', sessionBypass, tenantContext, require('../modules/clientes/clientes.controller'));
router.use('/auditoria', sessionBypass, tenantContext, require('../modules/auditoria/auditoria.controller'));
router.use('/sucursales', sessionBypass, tenantContext, require('../modules/sucursales/sucursales.controller'));
router.use('/inventario', sessionBypass, tenantContext, require('../modules/movimientos/movimientos.controller'));
router.use('/movimientos', sessionBypass, tenantContext, require('../modules/movimientos/movimientos.controller'));
router.use('/compras', sessionBypass, tenantContext, require('../modules/compras/compras.controller'));
router.use('/proveedores', sessionBypass, tenantContext, require('../modules/proveedores/proveedores.controller'));
router.use('/empresa', sessionBypass, tenantContext, require('../modules/empresa/empresa.controller'));
router.use('/roles', sessionBypass, tenantContext, require('../modules/roles/roles.controller'));
router.use('/dashboard', sessionBypass, tenantContext, require('./bi.routes'));
router.use('/reportes', sessionBypass, tenantContext, require('../modules/reportes/reportes.controller'));
router.use('/delegaciones', sessionBypass, tenantContext, require('../modules/delegaciones/delegaciones.controller'));
router.use('/kardex', sessionBypass, tenantContext, require('../modules/kardex/kardex.controller'));
router.use('/cuentas-cobrar', sessionBypass, tenantContext, require('../modules/cuentas_cobrar/cuentas_cobrar.controller'));
router.use('/cuentas-pagar', sessionBypass, tenantContext, require('../modules/cuentas_pagar/cuentas_pagar.controller'));

// Analítica y Business Intelligence (Fase 14)
router.use('/bi', sessionBypass, tenantContext, require('./bi.routes'));
router.use('/olap', authenticate, tenantContext, require('./olap.routes'));

module.exports = router;

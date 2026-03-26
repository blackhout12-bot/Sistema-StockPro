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

router.use('/pos', sessionBypass, tenantContext, require('../modules/pos/pos.controller'));
router.use('/payments', sessionBypass, require('../modules/payments/payments.controller'));
router.use('/importacion', sessionBypass, tenantContext, require('../modules/importacion/importacion.controller'));
router.use('/monedas', sessionBypass, require('../modules/configuracion/monedas.controller'));
router.use('/contextos', sessionBypass, tenantContext, require('../modules/contextos/contextos.controller'));
router.use('/delegaciones', sessionBypass, tenantContext, require('../modules/delegaciones/delegaciones.controller'));

// Analítica y Business Intelligence (Fase 14)
router.use('/bi', authenticate, tenantContext, require('./bi.routes'));
router.use('/olap', authenticate, tenantContext, require('./olap.routes'));

module.exports = router;

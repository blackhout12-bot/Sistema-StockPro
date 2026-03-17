// src/routes/v1.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../config/db');
const { redisClient, getRedisStatus } = require('../config/redis');
const rabbitMQ = require('../config/rabbitmq');

// Limiter para Auth (Desactivado para Debug)
const authLimiter = (req, res, next) => next();

// --- Definición de Rutas V1 ---
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

// Públicas (Auth)
router.use('/auth', authLimiter, require('../modules/auth/auth.controller'));
router.use('/auth/sso', authLimiter, require('../modules/auth/auth_sso.controller'));

// Protegidas (Requieren Auth y Tenant Context)
router.use('/notificaciones', authenticate, tenantContext, require('../modules/notificaciones/notificaciones.controller'));
router.use('/reportes', authenticate, tenantContext, require('../modules/reportes/reportes.controller'));
router.use('/productos', authenticate, tenantContext, require('../modules/productos/productos.controller'));
router.use('/movimientos', authenticate, tenantContext, require('../modules/movimientos/movimientos.controller'));
router.use('/empresa', authenticate, tenantContext, require('../modules/empresa/empresa.controller'));
router.use('/clientes', authenticate, tenantContext, require('../modules/clientes/clientes.controller'));
router.use('/facturacion', authenticate, tenantContext, require('../modules/facturacion/facturacion.controller'));
router.use('/payments', authenticate, require('../modules/payments/payments.controller'));
router.use('/importacion', authenticate, tenantContext, require('../modules/importacion/importacion.controller'));
router.use('/monedas', authenticate, require('../modules/configuracion/monedas.controller'));

// Analítica y Business Intelligence (Fase 14)
router.use('/bi', authenticate, tenantContext, require('./bi.routes'));
router.use('/olap', authenticate, tenantContext, require('./olap.routes'));

module.exports = router;

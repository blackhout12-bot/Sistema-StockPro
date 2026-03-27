// src/middlewares/health.middleware.js
const { connectDB } = require('../config/db');
const { redisClient, getRedisStatus } = require('../config/redis');
const rabbitMQ = require('../config/rabbitmq');
const logger = require('../utils/logger');

/**
 * Middleware para inyectar endpoints de salud en un router.
 * @param {string} moduleName Nombre del módulo para identificación en logs.
 * @param {Object} [options] Opciones adicionales.
 * @param {Function} [options.customCheck] Función asíncrona que retorna un booleano o lanza error.
 */
const withHealth = (moduleName, options = {}) => {
    return (req, res, next) => {
        // Solo respondemos si es el path exacto /health o /ready
        if (req.path === '/health') {
            return (async () => {
                let status = 'UP';
                let extra = {};
                if (options.customCheck) {
                    try {
                        const result = await options.customCheck();
                        if (result === false) status = 'DEGRADED';
                        if (typeof result === 'object') extra = result;
                    } catch (e) {
                        status = 'DEGRADED';
                        extra = { error: e.message };
                    }
                }
                return res.json({
                    status,
                    module: moduleName,
                    ...extra,
                    timestamp: new Date().toISOString()
                });
            })();
        }

        if (req.path === '/ready') {
            return (async () => {
                const checks = {
                    database: 'UNKNOWN',
                    redis: 'UNKNOWN',
                    rabbitmq: 'UNKNOWN'
                };
                let isHealthy = true;

                try {
                    // Check DB
                    const pool = await connectDB();
                    await pool.query('SELECT 1');
                    checks.database = 'OK';
                    
                    // Check Redis
                    if (getRedisStatus() === 'OK') {
                        await redisClient.ping();
                        checks.redis = 'OK';
                    } else {
                        isHealthy = false;
                        checks.redis = 'DOWN';
                    }

                    // Check RabbitMQ
                    if (rabbitMQ.connection && rabbitMQ.channel) {
                        checks.rabbitmq = 'OK';
                    } else {
                        isHealthy = false;
                        checks.rabbitmq = 'DOWN';
                    }

                    if (isHealthy) {
                        return res.json({ status: 'READY', module: moduleName, checks });
                    } else {
                        return res.status(503).json({ status: 'NOT_READY', module: moduleName, checks });
                    }
                } catch (error) {
                    logger.error({ module: moduleName, err: error.message }, 'Readiness check failed');
                    return res.status(503).json({
                        status: 'NOT_READY',
                        module: moduleName,
                        error: error.message
                    });
                }
            })();
        }

        next();
    };
};

module.exports = withHealth;

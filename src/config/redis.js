// src/config/redis.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Status indicators for monitoring
let redisStatus = 'INITIALIZING';
let bullmqStatus = 'WAITING';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'tu_password_local_seguro',
    maxRetriesPerRequest: null, // Requerido por BullMQ
    retryStrategy(times) {
        if (times > 3) {
            logger.warn('Redis retry limit reached. Using 60s lazy retry interval.');
            return 60000; // Wait 1 minute before checking again
        }
        const delay = Math.min(times * 300, 3000);
        return delay;
    }
};

// Instancia global principal para Caché general (No encolar si está offline para evitar bloqueos de HTTP)
const redisClient = new Redis({ ...redisConfig, enableOfflineQueue: false });

redisClient.on('connect', () => {
    redisStatus = 'OK';
    logger.info('Conectado a Redis Exitosamente');
});

redisClient.on('reconnecting', () => {
    redisStatus = 'RECONNECTING';
    logger.warn('Reconectando a Redis...');
});

redisClient.on('error', (err) => {
    redisStatus = 'FAILED';
    if (err.code === 'ECONNREFUSED') {
        logger.warn('Redis no disponible en ' + redisConfig.host + ':' + redisConfig.port + '. Operando en modo degradado.');
    } else {
        logger.error({ err: err.message }, 'Error en cliente Redis');
    }
});

// Para BullMQ se recomienda reutilizar conexiones o crear exclusivas.
const redisConnectionParams = redisConfig;

/**
 * Función helper para Cache (GET)
 */
async function getCache(key) {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        logger.warn({ error: e.message, key }, 'Error leyendo de Redis. Bypass...');
        return null;
    }
}

/**
 * Función helper para Cache (SET)
 */
async function setCache(key, value, ttlSeconds = 300) {
    try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e) {
        logger.warn({ error: e.message, key }, 'Error escribiendo en Redis.');
    }
}

/**
 * Elimina llave(s) de la caché.
 */
async function deleteCache(keyPattern) {
    try {
        if (keyPattern.includes('*')) {
            const keys = await redisClient.keys(keyPattern);
            if (keys.length) await redisClient.del(keys);
        } else {
            await redisClient.del(keyPattern);
        }
    } catch (e) {
        logger.warn({ error: e.message, keyPattern }, 'Error invalidando Redis.');
    }
}

module.exports = {
    redisClient,
    redisConnectionParams,
    getCache,
    setCache,
    deleteCache,
    getRedisStatus: () => redisStatus,
    getBullmqStatus: () => bullmqStatus,
    setBullmqStatus: (status) => { bullmqStatus = status; }
};

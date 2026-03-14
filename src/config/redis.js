// src/config/redis.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'tu_password_local_seguro',
    maxRetriesPerRequest: null // Requerido por BullMQ
};

// Instancia global principal para Caché general
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => logger.info('Conectado a Redis Exitosamente'));
redisClient.on('error', (err) => logger.error({ err: err.message }, 'Error conectando a Redis'));

// Para BullMQ se recomienda reutilizar conexiones o crear exclusivas.
// BullMQ usa 3 conexiones: cliente, subscriber y bclient.
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
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds Expiración (Default: 5 mins)
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
 * Soporta patron con asterisco * (Invalida masivamente, OJO en prod).
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
    deleteCache
};

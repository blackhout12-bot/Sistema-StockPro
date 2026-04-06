const { getCache, setCache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Middleware de caché unificado usando Redis.
 * Escala horizontalmente usando getCache/setCache.
 *
 * @param {number} ttlSeconds - Tiempo de Vida en la caché en segundos (default: 300)
 */
const cacheMiddleware = (ttlSeconds = 300) => {
    return async (req, res, next) => {
        // Solo cacheamos peticiones de lectura GET
        if (req.method !== 'GET') {
            return next();
        }
        
        try {
            const cacheKey = `cache:${req.tenant_id || 'global'}:${req.originalUrl}`;
            
            // 1. Intentar resolver la entidad desde Redis
            const cachedResponse = await getCache(cacheKey);
            
            if (cachedResponse) {
                // Attach a header to specify it's matching cache for frontend validation
                res.setHeader('X-Cache', 'HIT');
                return res.json(cachedResponse);
            }
            
            // 2. Interceptar el response original
            const originalJson = res.json;
            res.json = function (body) {
                // Escribir asincrónicamente el key y ttl
                setCache(cacheKey, body, ttlSeconds);
                res.setHeader('X-Cache', 'MISS');
                // Devolver el payload nativo
                return originalJson.call(this, body);
            };
            
            next();
        } catch (error) {
            logger.warn({ err: error.message }, 'Cache middleware interrumpió una escritura por inestabilidad de Redis');
            next(); // Continuar incluso si el caché falla
        }
    };
};

module.exports = cacheMiddleware;

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Middleware para inyectar un traceId único por cada request HTTP.
 * Esto permite la correlación de logs y telemetría.
 */
const traceMiddleware = (req, res, next) => {
    // Tomar traceId de header entrante o generar uno nuevo
    const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
    
    // Adjuntar al objeto request para uso posterior
    req.traceId = traceId;
    
    // Adjuntar al header de respuesta
    res.setHeader('X-Trace-Id', traceId);

    next();
};

module.exports = traceMiddleware;

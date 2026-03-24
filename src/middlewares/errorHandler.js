const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Interceptar Errores de Validación (Zod/Joi/Yup)
    if (err.name === 'ZodError') {
        logger.warn({ path: req.path, issues: err.errors }, 'Validation Error');
        return res.status(400).json({
            error: true,
            message: 'Error de Validación de Datos',
            issues: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
    }

    // Errores Generales
    logger.error({ 
        err: err.message, 
        stack: err.stack, 
        path: req.originalUrl, 
        method: req.method 
    }, 'Excepción Global Capturada');

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Error Interno del Servidor' : (err.message || 'Error Desconocido');

    // Inyección de Notificación por Error Crítico en DB (solo si viaja empresa_id)
    if (statusCode === 500 && req.tenant_id) {
        try {
            const { connectDB } = require('../config/db');
            const notificacionRepo = require('../repositories/notificacion.repository');
            connectDB().then(pool => {
                notificacionRepo.create(pool, {
                    empresa_id: req.tenant_id,
                    usuario_id: req.user ? req.user.id : null,
                    titulo: 'Fallo Sistémico',
                    mensaje: `Ruta: [${req.method}] ${req.originalUrl} - Msg: ${err.message}`,
                    tipo: 'danger'
                }).catch(e => logger.error({ err: e.message }, 'Fallo al despachar notificación de Error'));
            }).catch(e => logger.error({ err: e.message }, 'Fallo de conexión en Error Handler'));
        } catch (ignored) {}
    }

    res.status(statusCode).json({
        error: true,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
};

module.exports = errorHandler;

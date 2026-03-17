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

    res.status(statusCode).json({
        error: true,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
};

module.exports = errorHandler;

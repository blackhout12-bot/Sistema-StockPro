const { z, ZodError } = require('zod');

/**
 * Middleware genérico para validar request body, query o params usando schemas de Zod.
 * @param {z.ZodObject} schema - El schema de Zod a validar contra req.body
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            // Intentar parsear el body. Strip remueve propiedades no definidas en el schema.
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Formatear los errores de Zod para una respuesta más limpia
                const errorMessages = (error.issues || error.errors || []).map((issue) => ({
                    campo: issue.path.join('.'),
                    mensaje: issue.message
                }));

                return res.status(400).json({
                    error: 'Error de validación de datos',
                    detalles: errorMessages
                });
            }
            // Error no previsto (ej. malformed request body que no llega a Zod) 
            res.status(400).json({ error: 'Body de solicitud inválido' });
        }
    };
};

module.exports = { validateBody };

const auditRepository = require('../repositories/audit.repository');

/**
 * Middleware para registrar auditoría de acciones.
 * @param {string} accion - El nombre de la acción (ej. "crear", "actualizar", "eliminar")
 * @param {string} entidad - El módulo afectado (ej. "Producto", "Factura")
 */
const audit = (accion, entidad) => {
    return (req, res, next) => {
        // Escuchar el evento 'finish' para asegurarnos de que la acción se completó
        // y para poder leer req.params/res.locals si se actualizaron en el controller.
        res.on('finish', () => {
            // Solo auditar si la respuesta fue exitosa (200, 201, 204)
            if (res.statusCode >= 200 && res.statusCode < 300) {

                // Identificar ID (útil para POST/PUT/DELETE)
                // A veces el controlador inyecta res.locals.insertedId
                const targetId = req.params.id || res.locals.insertedId || null;

                // Limpiamos datos sensibles del payload
                const payload = { ...req.body };
                if (payload.password) delete payload.password;
                if (payload.nuevaPassword) delete payload.nuevaPassword;

                // Registrar de forma asíncrona sin bloquear
                auditRepository.logAction({
                    empresa_id: req.user?.empresa_id || null,
                    usuario_id: req.user?.id || null,
                    accion,
                    entidad,
                    entidad_id: targetId,
                    payload,
                    ip: req.ip || req.connection.remoteAddress
                });
            }
        });

        next();
    };
};

module.exports = audit;

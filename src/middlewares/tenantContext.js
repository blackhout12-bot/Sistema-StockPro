// src/middlewares/tenantContext.js
const { obtenerMembresia } = require('../repositories/auth.repository');

/**
 * Middleware para asegurar y validar el contexto del tenant (empresa).
 * Evita fugas de datos al validar que el usuario tenga acceso a la empresa solicitada.
 */
async function tenantContext(req, res, next) {
    try {
        // PRIORIDAD 1: Header explícito (usado por el frontend para cambiar de empresa)
        const headerEmpresaId = req.headers['x-empresa-id'];

        // PRIORIDAD 1.5: Query param explícito o Body param (usado para descargas directas)
        const queryEmpresaId = req.query.empresa_id || (req.body && req.body.empresa_id);

        // PRIORIDAD 2: El empresa_id por defecto que viene en el JWT
        const jwtEmpresaId = req.user.empresa_id;

        let selectedId = headerEmpresaId ? parseInt(headerEmpresaId) : (queryEmpresaId ? parseInt(queryEmpresaId) : jwtEmpresaId);

        if (!selectedId || isNaN(selectedId)) {
            return res.status(400).json({ error: 'Contexto de empresa (empresa_id) inválido o faltante.' });
        }

        // VALIDACIÓN DE SEGURIDAD: ¿Tiene el usuario acceso real a esta empresa?
        // Esto previene que un usuario con un JWT válido intente acceder a otra empresa cambiando el header.
        const membresia = await obtenerMembresia(req.user.id, selectedId);

        if (!membresia || !membresia.activo) {
            req.log.warn({
                msg: 'Intento de acceso a empresa no autorizada',
                userId: req.user.id,
                requestedEmpresaId: selectedId,
                ip: req.ip
            });
            return res.status(403).json({
                error: 'No tienes permiso para acceder a los datos de esta empresa.'
            });
        }

        // Establecer el contexto seguro para el resto de la ejecución
        req.tenant_id = selectedId;
        req.user.rol = membresia.rol; // Actualizar el rol según la empresa actual por si varía

        next();
    } catch (err) {
        req.log.error({ err, msg: 'Error de validación de contexto de tenant' });
        return res.status(500).json({ error: 'Error interno validando contexto de empresa.' });
    }
}

module.exports = tenantContext;

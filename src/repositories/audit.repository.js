const { connectDB } = require('../config/db');

class AuditRepository {
    async logAction({ empresa_id, usuario_id, accion, entidad, entidad_id, payload, ip }) {
        try {
            const pool = await connectDB();
            // Usar parámetros nombrados
            await pool.request()
                .input('empresa_id', empresa_id)
                .input('usuario_id', usuario_id)
                .input('accion', accion)
                .input('entidad', entidad)
                .input('entidad_id', entidad_id ? String(entidad_id) : null)
                .input('payload', payload ? JSON.stringify(payload) : null)
                .input('ip', ip)
                .query(`
          INSERT INTO dbo.AuditLog
          (empresa_id, usuario_id, accion, entidad, entidad_id, payload, ip)
          VALUES
          (@empresa_id, @usuario_id, @accion, @entidad, @entidad_id, @payload, @ip)
        `);
        } catch (err) {
            // Ignoramos errores de auditoría para no bloquear la operación principal,
            // pero idealmente se registrarían en un logger como pino.
            const logger = require('../utils/logger');
            logger.error({ err, context: 'AuditLog' }, 'Fallo al registrar auditoría');
        }
    }
}

module.exports = new AuditRepository();

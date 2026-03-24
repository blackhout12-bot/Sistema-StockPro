const { connectDB } = require('../config/db');

class AuditRepository {
    async logAction({ empresa_id, usuario_id, accion, entidad, entidad_id, payload, valor_anterior, valor_nuevo, ip }) {
        const vNuevo = valor_nuevo || payload;
        try {
            const pool = await connectDB();
            await pool.request()
                .input('empresa_id', empresa_id)
                .input('usuario_id', usuario_id)
                .input('accion', accion)
                .input('entidad', entidad)
                .input('entidad_id', entidad_id ? parseInt(entidad_id, 10) : null)
                .input('valor_anterior', valor_anterior ? (typeof valor_anterior === 'object' ? JSON.stringify(valor_anterior) : valor_anterior) : null)
                .input('valor_nuevo', vNuevo ? (typeof vNuevo === 'object' ? JSON.stringify(vNuevo) : vNuevo) : null)
                .input('ip', ip)
                .query(`
          INSERT INTO dbo.Auditoria
          (empresa_id, usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, ip)
          VALUES
          (@empresa_id, @usuario_id, @accion, @entidad, @entidad_id, @valor_anterior, @valor_nuevo, @ip)
        `);
        } catch (err) {
            // Ignoramos errores de auditoría para no bloquear la operación principal,
            // pero idealmente se registrarían en un logger como pino.
            const logger = require('../utils/logger');
            logger.error({ err, context: 'Auditoria' }, 'Fallo al registrar auditoría');
        }
    }
}

module.exports = new AuditRepository();

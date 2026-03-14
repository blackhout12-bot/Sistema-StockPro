const { sql } = require('../config/db');

class NotificacionRepository {
    async getByUsuario(pool, usuario_id, empresa_id) {
        const result = await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT * FROM Notificaciones 
                WHERE empresa_id = @empresa_id 
                AND (usuario_id = @usuario_id OR usuario_id IS NULL)
                ORDER BY creado_en DESC
            `);
        return result.recordset;
    }

    async create(pool, { empresa_id, usuario_id, titulo, mensaje, tipo }) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .input('usuario_id', sql.Int, usuario_id || null)
            .input('titulo', sql.NVarChar, titulo)
            .input('mensaje', sql.NVarChar, mensaje)
            .input('tipo', sql.NVarChar, tipo || 'info')
            .query(`
                INSERT INTO Notificaciones (empresa_id, usuario_id, titulo, mensaje, tipo)
                OUTPUT INSERTED.*
                VALUES (@empresa_id, @usuario_id, @titulo, @mensaje, @tipo)
            `);
        return result.recordset[0];
    }

    async markAsRead(pool, id, usuario_id, empresa_id) {
        await pool.request()
            .input('id', sql.Int, id)
            .input('usuario_id', sql.Int, usuario_id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                UPDATE Notificaciones 
                SET leido = 1 
                WHERE id = @id AND empresa_id = @empresa_id 
                AND (usuario_id = @usuario_id OR usuario_id IS NULL)
            `);
    }

    async markAllAsRead(pool, usuario_id, empresa_id) {
        await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                UPDATE Notificaciones 
                SET leido = 1 
                WHERE empresa_id = @empresa_id 
                AND (usuario_id = @usuario_id OR usuario_id IS NULL)
            `);
    }
}

module.exports = new NotificacionRepository();

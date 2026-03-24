const sql = require('mssql');
const { connectDB } = require('../../config/db');

class DelegacionesModel {
    async getAll() {
        const pool = await connectDB();
        const res = await pool.request().query(`
            SELECT 
                d.id, d.rol_asignado, d.fecha_inicio, d.fecha_fin, d.estado, d.creado_en,
                delte.nombre as delegante_nombre, delte.email as delegante_email,
                dldo.nombre as delegado_nombre, dldo.email as delegado_email
            FROM Delegaciones d
            JOIN Usuarios delte ON d.delegante_id = delte.id
            JOIN Usuarios dldo ON d.delegado_id = dldo.id
            ORDER BY d.creado_en DESC
        `);
        return res.recordset;
    }

    async getByUserId(usuario_id) {
        const pool = await connectDB();
        const res = await pool.request()
            .input('uid', sql.Int, usuario_id)
            .query(`
                SELECT 
                    d.id, d.rol_asignado, d.fecha_inicio, d.fecha_fin, d.estado,
                    delte.nombre as delegante_nombre, dldo.nombre as delegado_nombre
                FROM Delegaciones d
                JOIN Usuarios delte ON d.delegante_id = delte.id
                JOIN Usuarios dldo ON d.delegado_id = dldo.id
                WHERE d.delegante_id = @uid OR d.delegado_id = @uid
                ORDER BY d.creado_en DESC
            `);
        return res.recordset;
    }

    async create(delegante_id, payload) {
        const { delegado_id, rol_asignado, fecha_fin } = payload;
        const pool = await connectDB();

        // Verificar que no auto-delegue
        if (delegante_id === parseInt(delegado_id)) {
            throw new Error('Un operador no puede delegarse permisos a sí mismo.');
        }

        const res = await pool.request()
            .input('delegante', sql.Int, delegante_id)
            .input('delegado', sql.Int, delegado_id)
            .input('rol', sql.VarChar, rol_asignado)
            .input('fin', sql.DateTime, new Date(fecha_fin))
            .query(`
                INSERT INTO Delegaciones (delegante_id, delegado_id, rol_asignado, fecha_inicio, fecha_fin, estado)
                OUTPUT INSERTED.*
                VALUES (@delegante, @delegado, @rol, GETDATE(), @fin, 'ACTIVO')
            `);
        return res.recordset[0];
    }

    async revoke(id, delegante_id) {
        const pool = await connectDB();
        // Solo el Admin Total o el Creador de la delegación pueden revocarla
        const res = await pool.request()
            .input('id', sql.Int, id)
            .input('delegante', sql.Int, delegante_id)
            .query(`
                UPDATE Delegaciones 
                SET estado = 'REVOCADO', fecha_fin = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id AND (delegante_id = @delegante OR @delegante IN (SELECT id FROM Usuarios WHERE rol = 'admin'))
            `);
            
        if (res.rowsAffected[0] === 0) {
            throw new Error('Delegación inexistente o falta de privilegios para revocarla.');
        }
        return res.recordset[0];
    }
}

module.exports = new DelegacionesModel();

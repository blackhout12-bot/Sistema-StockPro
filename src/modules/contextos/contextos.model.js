const sql = require('mssql');
const { connectDB } = require('../../config/db');

class ContextosModel {
    async getAll(empresa_id) {
        const pool = await connectDB();
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT c.id, c.nombre, c.descripcion, c.empresa_id, c.sucursal_id, s.nombre as sucursal_nombre
                FROM Contextos c
                JOIN Sucursales s ON c.sucursal_id = s.id
                WHERE c.empresa_id = @empresa_id
                ORDER BY c.nombre ASC
            `);
        return result.recordset;
    }

    async getByUserId(usuario_id) {
        const pool = await connectDB();
        const result = await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .query(`
                SELECT c.id, c.nombre, c.descripcion, c.empresa_id, c.sucursal_id, s.nombre as sucursal_nombre, cu.rol_local
                FROM Contextos c
                JOIN Sucursales s ON c.sucursal_id = s.id
                JOIN Contextos_Usuarios cu ON cu.sucursal_id = c.sucursal_id
                WHERE cu.usuario_id = @usuario_id
            `);
        return result.recordset;
    }

    async updateActiveContext(usuario_id, contexto_id) {
        const pool = await connectDB();
        // Validar que el contexto mapeado exista y el usuario tenga un pivote allí
        const validation = await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('contexto_id', sql.Int, contexto_id)
            .query(`
                SELECT c.empresa_id, c.sucursal_id, cu.rol_local 
                FROM Contextos c
                JOIN Contextos_Usuarios cu ON cu.sucursal_id = c.sucursal_id
                WHERE c.id = @contexto_id AND cu.usuario_id = @usuario_id
            `);

        if (validation.recordset.length === 0) {
            throw new Error('Forbidden: No tiene acceso a este contexto organizacional.');
        }

        const nuevoContexto = validation.recordset[0];
        
        // Persistir el contexto activo en la fila de Usuarios
        await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('sucursal_id', sql.Int, nuevoContexto.sucursal_id)
            .query(`
                UPDATE Usuarios SET sucursal_id = @sucursal_id, actualizado_en = GETDATE()
                WHERE id = @usuario_id
            `);
            
        return nuevoContexto;
    }
}

module.exports = new ContextosModel();

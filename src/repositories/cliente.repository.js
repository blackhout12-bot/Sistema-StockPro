const { sql } = require('../config/db');

class ClienteRepository {
    async getAll(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT * FROM Clientes WHERE empresa_id = @empresa_id ORDER BY nombre ASC');
        return result.recordset;
    }

    async getById(pool, id, empresa_id) {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT * FROM Clientes WHERE id = @id AND empresa_id = @empresa_id');
        return result.recordset[0];
    }

    async create(pool, data, empresa_id) {
        const { nombre, documento_identidad, email, telefono, direccion, nivel_vip, puntos } = data;

        const request = pool.request();
        request.input('nombre', sql.NVarChar, nombre);
        request.input('documento_identidad', sql.NVarChar, documento_identidad);
        request.input('email', sql.NVarChar, email || null);
        request.input('telefono', sql.NVarChar, telefono || null);
        request.input('direccion', sql.NVarChar, direccion || null);
        request.input('nivel_vip', sql.NVarChar, nivel_vip || 'Bronce');
        request.input('puntos', sql.Int, puntos || 0);
        request.input('empresa_id', sql.Int, empresa_id);

        const result = await request.query(`
            INSERT INTO Clientes (nombre, documento_identidad, email, telefono, direccion, nivel_vip, puntos, empresa_id)
            OUTPUT INSERTED.id
            VALUES (@nombre, @documento_identidad, @email, @telefono, @direccion, @nivel_vip, @puntos, @empresa_id)
        `);
        return result.recordset[0].id;
    }

    async update(pool, id, data, empresa_id) {
        const { nombre, documento_identidad, email, telefono, direccion, nivel_vip, puntos } = data;

        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('empresa_id', sql.Int, empresa_id);
        request.input('nombre', sql.NVarChar, nombre);
        request.input('documento_identidad', sql.NVarChar, documento_identidad);
        request.input('email', sql.NVarChar, email || null);
        request.input('telefono', sql.NVarChar, telefono || null);
        request.input('direccion', sql.NVarChar, direccion || null);
        request.input('nivel_vip', sql.NVarChar, nivel_vip || 'Bronce');
        request.input('puntos', sql.Int, puntos || 0);

        await request.query(`
            UPDATE Clientes 
            SET nombre = @nombre,
                documento_identidad = @documento_identidad,
                email = @email,
                telefono = @telefono,
                direccion = @direccion,
                nivel_vip = @nivel_vip,
                puntos = @puntos
            WHERE id = @id AND empresa_id = @empresa_id
        `);
    }

    async delete(pool, id, empresa_id) {
        await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query('DELETE FROM Clientes WHERE id = @id AND empresa_id = @empresa_id');
    }
}

module.exports = new ClienteRepository();

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
        const { nombre, documento_identidad, email, telefono, direccion } = data;

        const request = pool.request();
        request.input('nombre', sql.NVarChar, nombre);
        request.input('documento_identidad', sql.NVarChar, documento_identidad);
        request.input('email', sql.NVarChar, email || null);
        request.input('telefono', sql.NVarChar, telefono || null);
        request.input('direccion', sql.NVarChar, direccion || null);
        request.input('empresa_id', sql.Int, empresa_id);

        const result = await request.query(`
            INSERT INTO Clientes (nombre, documento_identidad, email, telefono, direccion, empresa_id)
            OUTPUT INSERTED.id
            VALUES (@nombre, @documento_identidad, @email, @telefono, @direccion, @empresa_id)
        `);
        return result.recordset[0].id;
    }

    async update(pool, id, data, empresa_id) {
        const { nombre, documento_identidad, email, telefono, direccion } = data;

        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('empresa_id', sql.Int, empresa_id);
        request.input('nombre', sql.NVarChar, nombre);
        request.input('documento_identidad', sql.NVarChar, documento_identidad);
        request.input('email', sql.NVarChar, email || null);
        request.input('telefono', sql.NVarChar, telefono || null);
        request.input('direccion', sql.NVarChar, direccion || null);

        await request.query(`
            UPDATE Clientes 
            SET nombre = @nombre,
                documento_identidad = @documento_identidad,
                email = @email,
                telefono = @telefono,
                direccion = @direccion
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

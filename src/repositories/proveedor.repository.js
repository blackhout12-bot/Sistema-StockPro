const sql = require('mssql');

class ProveedorRepository {
    async getAll(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT * FROM Proveedores WHERE empresa_id = @empresa_id AND estado = \'ACTIVO\'');
        return result.recordset;
    }

    async getById(pool, id, empresa_id) {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT * FROM Proveedores WHERE id = @id AND empresa_id = @empresa_id');
        return result.recordset[0] || null;
    }

    async create(pool, data, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .input('razon_social', sql.NVarChar, data.razon_social)
            .input('cuit', sql.NVarChar, data.cuit)
            .input('condicion_fiscal', sql.NVarChar, data.condicion_fiscal)
            .input('email', sql.NVarChar, data.email)
            .input('telefono', sql.NVarChar, data.telefono)
            .input('direccion', sql.NVarChar, data.direccion)
            .query(`
                INSERT INTO Proveedores (empresa_id, razon_social, cuit, condicion_fiscal, email, telefono, direccion)
                OUTPUT INSERTED.id
                VALUES (@empresa_id, @razon_social, @cuit, @condicion_fiscal, @email, @telefono, @direccion);
            `);
        return result.recordset[0].id;
    }

    async update(pool, id, data, empresa_id) {
        await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .input('razon_social', sql.NVarChar, data.razon_social)
            .input('cuit', sql.NVarChar, data.cuit)
            .input('condicion_fiscal', sql.NVarChar, data.condicion_fiscal)
            .input('email', sql.NVarChar, data.email)
            .input('telefono', sql.NVarChar, data.telefono)
            .input('direccion', sql.NVarChar, data.direccion)
            .input('estado', sql.NVarChar, data.estado || 'ACTIVO')
            .query(`
                UPDATE Proveedores
                SET razon_social = @razon_social, cuit = @cuit, condicion_fiscal = @condicion_fiscal,
                    email = @email, telefono = @telefono, direccion = @direccion, estado = @estado, actualizado_en = GETDATE()
                WHERE id = @id AND empresa_id = @empresa_id
            `);
    }

    async delete(pool, id, empresa_id) {
        await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query('UPDATE Proveedores SET estado = \'INACTIVO\' WHERE id = @id AND empresa_id = @empresa_id');
    }
}

module.exports = new ProveedorRepository();

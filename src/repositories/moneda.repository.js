const sql = require('mssql');

class MonedaRepository {
    async getAll(pool) {
        const result = await pool.request().query('SELECT * FROM Monedas WHERE activo = 1');
        return result.recordset;
    }

    async getById(pool, id) {
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT * FROM Monedas WHERE id = @id');
        return result.recordset[0];
    }
}

module.exports = new MonedaRepository();

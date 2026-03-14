const { sql } = require('../config/db');

class LoteRepository {
    async getAllByProducto(pool, producto_id, empresa_id) {
        const result = await pool.request()
            .input('productoId', sql.Int, producto_id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT * FROM Lotes 
                WHERE producto_id = @productoId AND empresa_id = @empresa_id
                ORDER BY fecha_vto ASC, creado_en ASC
            `);
        return result.recordset;
    }

    async getAvailableByProducto(pool, producto_id, empresa_id) {
        const result = await pool.request()
            .input('productoId', sql.Int, producto_id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT * FROM Lotes 
                WHERE producto_id = @productoId 
                  AND empresa_id = @empresa_id 
                  AND cantidad > 0
                ORDER BY fecha_vto ASC, creado_en ASC
            `);
        return result.recordset;
    }

    async create(pool, data, empresa_id) {
        const { producto_id, nro_lote, cantidad, fecha_vto } = data;
        const result = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('nro_lote', sql.NVarChar, nro_lote)
            .input('cantidad', sql.Int, cantidad)
            .input('fecha_vto', sql.Date, (fecha_vto && typeof fecha_vto === 'string' && fecha_vto.trim() !== '') ? fecha_vto : null)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                INSERT INTO Lotes (producto_id, nro_lote, cantidad, fecha_vto, empresa_id)
                OUTPUT INSERTED.*
                VALUES (@producto_id, @nro_lote, @cantidad, @fecha_vto, @empresa_id)
            `);
        return result.recordset[0];
    }

    async updateStock(pool, id, cantidad, empresa_id) {
        // cantidad can be negative for deductions
        await pool.request()
            .input('id', sql.Int, id)
            .input('cantidad', sql.Int, cantidad)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                UPDATE Lotes 
                SET cantidad = cantidad + @cantidad
                WHERE id = @id AND empresa_id = @empresa_id
            `);
    }

    async getById(pool, id, empresa_id) {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT * FROM Lotes WHERE id = @id AND empresa_id = @empresa_id');
        return result.recordset[0];
    }
}

module.exports = new LoteRepository();

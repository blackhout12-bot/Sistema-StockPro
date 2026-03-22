const sql = require('mssql');

class KardexRepository {
    async getByProducto(pool, producto_id, empresa_id) {
        const result = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT k.*, p.nombre as producto_nombre
                FROM Kardex k
                LEFT JOIN Productos p ON k.producto_id = p.id
                WHERE k.producto_id = @producto_id AND k.empresa_id = @empresa_id
                ORDER BY k.fecha DESC, k.id DESC
            `);
        return result.recordset;
    }

    async getResumenValorizado(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT p.id as producto_id, p.nombre, p.stock,
                       (SELECT TOP 1 costo_unitario 
                        FROM Kardex k 
                        WHERE k.producto_id = p.id AND k.empresa_id = @empresa_id 
                        ORDER BY fecha DESC, id DESC) as ultimo_costo
                FROM Productos p
                WHERE p.empresa_id = @empresa_id AND p.stock > 0
            `);
        return result.recordset.map(r => ({
            ...r,
            valor_total: r.stock * (r.ultimo_costo || 0)
        }));
    }
}

module.exports = new KardexRepository();

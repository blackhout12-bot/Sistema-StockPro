// src/repositories/producto.repository.js
const { sql } = require('../config/db');

class ProductoRepository {
    /**
     * Obtiene productos de la empresa con métricas adicionales como num_ventas.
     */
    async getAll(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
        SELECT p.*,
               ISNULL((SELECT SUM(cantidad) FROM Movimientos m WHERE m.productoId = p.id AND m.tipo = 'salida'), 0) as num_ventas,
               -- check dinámico de sku si la columna existe (usado en la refactorización para retrocompatibilidad)
               CASE WHEN COL_LENGTH('Productos', 'sku') IS NOT NULL THEN (SELECT sku FROM Productos x WHERE x.id = p.id) ELSE NULL END as sku
        FROM Productos p
        WHERE p.empresa_id = @empresa_id
        ORDER BY p.creado_en DESC
      `);
        return result.recordset;
    }

    async getPaginated(pool, { empresa_id, page, limit, search, categoria }) {
        const offset = (page - 1) * limit;

        // Base Query
        let queryStr = `
            SELECT p.*,
                ISNULL((SELECT SUM(cantidad) FROM Movimientos m WHERE m.productoId = p.id AND m.tipo = 'salida'), 0) as num_ventas
            FROM Productos p
            WHERE p.empresa_id = @empresa_id
        `;
        let countQueryStr = `SELECT COUNT(*) as total FROM Productos p WHERE p.empresa_id = @empresa_id`;

        const request = pool.request();
        request.input('empresa_id', sql.Int, empresa_id);
        request.input('limit', sql.Int, limit);
        request.input('offset', sql.Int, offset);

        if (search) {
            // Utilizamos el prefijo N para literales NVARCHAR, pero aquí inyectamos por parametro
            queryStr += ` AND (p.nombre LIKE @search OR p.sku LIKE @search OR p.descripcion LIKE @search)`;
            countQueryStr += ` AND (p.nombre LIKE @search OR p.sku LIKE @search OR p.descripcion LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (categoria) {
            queryStr += ` AND p.categoria = @categoria`;
            countQueryStr += ` AND p.categoria = @categoria`;
            request.input('categoria', sql.NVarChar, categoria);
        }

        queryStr += ` ORDER BY p.creado_en DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const [itemsResult, countResult] = await Promise.all([
            request.query(queryStr),
            request.query(countQueryStr)
        ]);

        return {
            data: itemsResult.recordset,
            total: countResult.recordset[0].total,
            page,
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        };
    }

    async getById(pool, id, empresa_id) {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
        SELECT * FROM Productos 
        WHERE id = @id AND empresa_id = @empresa_id
      `);
        return result.recordset[0];
    }

    async create(pool, data, empresa_id) {
        const { nombre, descripcion, precio, stock, sku, stock_min = 0, stock_max } = data;

        // Inserción considerando las nuevas columnas del roadmap, 
        // pero haciendo fallback a la estructura vieja si la tabla no ha sido alterada aún en todas las BDs.
        // Usamos el check dinámico del esquema que ya tenía el modelo previo.
        const hasSkuColumn = await pool.request().query(`
      SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'sku'
    `).then(r => r.recordset.length > 0);

        const hasStockMinColumn = await pool.request().query(`
      SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'stock_min'
    `).then(r => r.recordset.length > 0);

        let newProductId;
        if (hasSkuColumn && hasStockMinColumn) {
            const result = await pool.request()
                .input('sku', sql.NVarChar, sku || null)
                .input('nombre', sql.NVarChar, nombre)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('precio', sql.Decimal(12, 2), precio)
                .input('stock', sql.Int, stock || 0)
                .input('stock_min', sql.Int, stock_min)
                .input('stock_max', sql.Int, stock_max || null)
                .input('moneda_id', sql.NVarChar(3), data.moneda_id || 'ARS')
                .input('empresa_id', sql.Int, empresa_id)
                .query(`
          INSERT INTO Productos (sku, nombre, descripcion, precio, stock, stock_min, stock_max, moneda_id, empresa_id)
          OUTPUT INSERTED.id
          VALUES (@sku, @nombre, @descripcion, @precio, @stock, @stock_min, @stock_max, @moneda_id, @empresa_id)
        `);
            newProductId = result.recordset[0].id;
        } else {
            // Fallback a columnas originales (con SKU dinámicamente insertado si es q solo existe SKU)
            let queryStr = `INSERT INTO Productos (nombre, descripcion, precio, stock, empresa_id`;
            let valStr = `VALUES (@nombre, @descripcion, @precio, @stock, @empresa_id`;

            if (hasSkuColumn) {
                queryStr += `, sku`;
                valStr += `, @sku`;
            }
            queryStr += `) OUTPUT INSERTED.id ${valStr})`;

            const req = pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('precio', sql.Decimal(12, 2), precio)
                .input('stock', sql.Int, stock || 0)
                .input('empresa_id', sql.Int, empresa_id);

            if (hasSkuColumn) req.input('sku', sql.NVarChar, sku || null);

            const result = await req.query(queryStr);
            newProductId = result.recordset[0].id;
        }

        // ── SINCRONIZAR STOCK INICIAL CON Depósito Principal ──
        const depRes = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT TOP 1 id FROM Depositos WHERE empresa_id = @empresa_id AND es_principal = 1 AND activo = 1');
        
        if (depRes.recordset.length > 0) {
            const depositoId = depRes.recordset[0].id;
            await pool.request()
                .input('pid', sql.Int, newProductId)
                .input('did', sql.Int, depositoId)
                .input('nstock', sql.Decimal(18,2), stock || 0)
                .query('INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @nstock)');
        }

        return newProductId;
    }

    async update(pool, id, data, empresa_id) {
        const { nombre, descripcion, precio, stock, sku } = data;

        const hasSkuColumn = await pool.request().query(`
      SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'sku'
    `).then(r => r.recordset.length > 0);

        let queryStr = `
      UPDATE Productos
      SET nombre = @nombre,
          descripcion = @descripcion,
          precio = @precio,
          stock = @stock,
          moneda_id = @moneda_id
    `;

        if (hasSkuColumn && sku !== undefined) {
            queryStr += `, sku = @sku `;
        }

        queryStr += ` WHERE id = @id AND empresa_id = @empresa_id`;

        const request = pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('precio', sql.Decimal(12, 2), precio)
            .input('stock', sql.Int, stock)
            .input('moneda_id', sql.NVarChar(3), data.moneda_id || 'ARS')
            .input('empresa_id', sql.Int, empresa_id);

        if (hasSkuColumn && sku !== undefined) {
            request.input('sku', sql.NVarChar, sku || null);
        }

        await request.query(queryStr);
    }

    async delete(pool, id, empresa_id) {
        await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
        DELETE FROM Productos 
        WHERE id = @id AND empresa_id = @empresa_id
      `);
    }
}

module.exports = new ProductoRepository();

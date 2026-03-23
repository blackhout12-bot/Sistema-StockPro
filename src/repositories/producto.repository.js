// src/repositories/producto.repository.js
const { sql } = require('../config/db');

class ProductoRepository {
    async getAll(pool, empresa_id, deposito_id) {
        const reqDb = pool.request().input('empresa_id', sql.Int, empresa_id);
        
        let stockSelect = '';
        if (deposito_id) {
            reqDb.input('deposito_id', sql.Int, deposito_id);
            stockSelect = ', ISNULL((SELECT SUM(cantidad) FROM ProductoDepositos pd WHERE pd.producto_id = p.id AND pd.deposito_id = @deposito_id), 0) as stock_deposito';
        }

        const result = await reqDb.query(`
        SELECT p.*,
               ISNULL(m.num_ventas, 0) as num_ventas ${stockSelect},
               (
                   SELECT d.nombre as deposito, pd.cantidad as stock
                   FROM ProductoDepositos pd
                   INNER JOIN Depositos d ON pd.deposito_id = d.id
                   WHERE pd.producto_id = p.id AND pd.cantidad > 0
                   FOR JSON PATH
               ) as desglose_depositos,
               (
                   SELECT TOP 1 nro_lote
                   FROM Lotes
                   WHERE producto_id = p.id AND cantidad > 0
                   ORDER BY fecha_vto ASC
               ) as lote,
               (
                   SELECT TOP 1 fecha_vto
                   FROM Lotes
                   WHERE producto_id = p.id AND cantidad > 0
                   ORDER BY fecha_vto ASC
               ) as fecha_vencimiento
        FROM Productos p
        LEFT JOIN (
            SELECT productoId, SUM(cantidad) as num_ventas
            FROM Movimientos
            WHERE tipo = 'salida'
            GROUP BY productoId
        ) m ON m.productoId = p.id
        WHERE p.empresa_id = @empresa_id
        ORDER BY p.creado_en DESC
      `);
        return result.recordset;
    }

    async getPaginated(pool, { empresa_id, page, limit, search, categoria }) {
        const offset = (page - 1) * limit;

        let queryStr = `
            SELECT p.*,
                ISNULL(m.num_ventas, 0) as num_ventas,
                (
                    SELECT d.nombre as deposito, pd.cantidad as stock
                    FROM ProductoDepositos pd
                    INNER JOIN Depositos d ON pd.deposito_id = d.id
                    WHERE pd.producto_id = p.id AND pd.cantidad > 0
                    FOR JSON PATH
                ) as desglose_depositos,
                (
                    SELECT TOP 1 nro_lote
                    FROM Lotes
                    WHERE producto_id = p.id AND cantidad > 0
                    ORDER BY fecha_vto ASC
                ) as lote,
                (
                    SELECT TOP 1 fecha_vto
                    FROM Lotes
                    WHERE producto_id = p.id AND cantidad > 0
                    ORDER BY fecha_vto ASC
                ) as fecha_vencimiento
            FROM Productos p
            LEFT JOIN (
                SELECT productoId, SUM(cantidad) as num_ventas
                FROM Movimientos
                WHERE tipo = 'salida'
                GROUP BY productoId
            ) m ON m.productoId = p.id
            WHERE p.empresa_id = @empresa_id
        `;
        let countQueryStr = `SELECT COUNT(*) as total FROM Productos p WHERE p.empresa_id = @empresa_id`;

        // CRITICAL FIX: mssql no permite reutilizar el mismo request para dos queries paralelas.
        // Se crean dos requests independientes con los mismos parámetros.
        const itemsRequest = pool.request();
        itemsRequest.input('empresa_id', sql.Int, empresa_id);
        itemsRequest.input('limit', sql.Int, limit);
        itemsRequest.input('offset', sql.Int, offset);

        const countRequest = pool.request();
        countRequest.input('empresa_id', sql.Int, empresa_id);

        if (search) {
            queryStr += ` AND (p.nombre LIKE @search OR p.sku LIKE @search OR p.descripcion LIKE @search)`;
            countQueryStr += ` AND (p.nombre LIKE @search OR p.sku LIKE @search OR p.descripcion LIKE @search)`;
            itemsRequest.input('search', sql.NVarChar, `%${search}%`);
            countRequest.input('search', sql.NVarChar, `%${search}%`);
        }

        if (categoria) {
            queryStr += ` AND p.categoria = @categoria`;
            countQueryStr += ` AND p.categoria = @categoria`;
            itemsRequest.input('categoria', sql.NVarChar, categoria);
            countRequest.input('categoria', sql.NVarChar, categoria);
        }

        queryStr += ` ORDER BY p.creado_en DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const [itemsResult, countResult] = await Promise.all([
            itemsRequest.query(queryStr),
            countRequest.query(countQueryStr)
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
            .query(`SELECT * FROM Productos WHERE id = @id AND empresa_id = @empresa_id`);
        return result.recordset[0];
    }

    async create(pool, data, empresa_id) {
        const { nombre, descripcion, precio, stock, sku, stock_min = 0, stock_max, image_url } = data;

        const hasSkuColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'sku'`).then(r => r.recordset.length > 0);
        const hasStockMinColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'stock_min'`).then(r => r.recordset.length > 0);
        const hasCustomFieldsColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'custom_fields'`).then(r => r.recordset.length > 0);
        const hasImageUrlColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'image_url'`).then(r => r.recordset.length > 0);
        const hasMonedaIdColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'moneda_id'`).then(r => r.recordset.length > 0);

        const cFieldsStr = typeof data.custom_fields === 'object' ? JSON.stringify(data.custom_fields) : (data.custom_fields || '{}');

        let newProductId;
        if (hasSkuColumn && hasStockMinColumn) {
            let queryStr = `INSERT INTO Productos (sku, nombre, descripcion, precio, stock, stock_min, stock_max, categoria, empresa_id`;
            let valStr = `VALUES (@sku, @nombre, @descripcion, @precio, @stock, @stock_min, @stock_max, @categoria, @empresa_id`;

            if (hasCustomFieldsColumn) { queryStr += `, custom_fields`; valStr += `, @custom_fields`; }
            if (hasImageUrlColumn) { queryStr += `, image_url`; valStr += `, @image_url`; }
            if (hasMonedaIdColumn) { queryStr += `, moneda_id`; valStr += `, @moneda_id`; }

            queryStr += `) OUTPUT INSERTED.id ${valStr})`;

            const request = pool.request()
                .input('sku', sql.NVarChar, sku || null)
                .input('nombre', sql.NVarChar, nombre)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('precio', sql.Decimal(12, 2), precio)
                .input('stock', sql.Int, stock || 0)
                .input('stock_min', sql.Int, stock_min)
                .input('stock_max', sql.Int, stock_max || null)
                .input('categoria', sql.NVarChar, data.categoria || null)
                .input('empresa_id', sql.Int, empresa_id);

            if (hasCustomFieldsColumn) request.input('custom_fields', sql.NVarChar(sql.MAX), cFieldsStr);
            if (hasImageUrlColumn) request.input('image_url', sql.NVarChar(255), image_url || null);
            if (hasMonedaIdColumn) request.input('moneda_id', sql.NVarChar(3), data.moneda_id || 'ARS');

            const result = await request.query(queryStr);
            newProductId = result.recordset[0].id;
        } else {
            let queryStr = `INSERT INTO Productos (nombre, descripcion, precio, stock, categoria, empresa_id`;
            let valStr = `VALUES (@nombre, @descripcion, @precio, @stock, @categoria, @empresa_id`;

            if (hasSkuColumn) { queryStr += `, sku`; valStr += `, @sku`; }
            if (hasCustomFieldsColumn) { queryStr += `, custom_fields`; valStr += `, @custom_fields`; }
            if (hasImageUrlColumn) { queryStr += `, image_url`; valStr += `, @image_url`; }

            queryStr += `) OUTPUT INSERTED.id ${valStr})`;

            const request = pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('precio', sql.Decimal(12, 2), precio)
                .input('stock', sql.Int, stock || 0)
                .input('categoria', sql.NVarChar, data.categoria || null)
                .input('empresa_id', sql.Int, empresa_id);

            if (hasSkuColumn) request.input('sku', sql.NVarChar, sku || null);
            if (hasCustomFieldsColumn) request.input('custom_fields', sql.NVarChar(sql.MAX), cFieldsStr);
            if (hasImageUrlColumn) request.input('image_url', sql.NVarChar(255), image_url || null);

            const result = await request.query(queryStr);
            newProductId = result.recordset[0].id;
        }

        let depRes = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT TOP 1 id FROM Depositos WHERE empresa_id = @empresa_id AND es_principal = 1 AND activo = 1');
            
        if (depRes.recordset.length === 0) {
            depRes = await pool.request()
                .input('empresa_id', sql.Int, empresa_id)
                .query('SELECT TOP 1 id FROM Depositos WHERE empresa_id = @empresa_id AND activo = 1');
        }
        
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
        const { nombre, descripcion, precio, stock, categoria, sku, custom_fields, image_url } = data;

        const hasSkuColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'sku'`).then(r => r.recordset.length > 0);
        const hasCustomFieldsColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'custom_fields'`).then(r => r.recordset.length > 0);
        const hasImageUrlColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'image_url'`).then(r => r.recordset.length > 0);
        const hasMonedaIdColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'moneda_id'`).then(r => r.recordset.length > 0);
        const hasActualizadoEnColumn = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'actualizado_en'`).then(r => r.recordset.length > 0);

        const cFieldsStr = typeof custom_fields === 'object' ? JSON.stringify(custom_fields) : (custom_fields || '{}');

        let queryStr = `
      UPDATE Productos
      SET nombre = @nombre,
          descripcion = @descripcion,
          precio = @precio,
          stock = @stock,
          categoria = @categoria
    `;

        if (hasMonedaIdColumn) queryStr += `, moneda_id = @moneda_id `;

        if (hasSkuColumn && sku !== undefined) queryStr += `, sku = @sku `;
        if (hasCustomFieldsColumn && custom_fields !== undefined) queryStr += `, custom_fields = @custom_fields `;
        if (hasImageUrlColumn && image_url !== undefined) queryStr += `, image_url = @image_url `;
        if (hasActualizadoEnColumn) queryStr += `, actualizado_en = GETDATE() `;

        queryStr += ` WHERE id = @id AND empresa_id = @empresa_id`;

        const request = pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('precio', sql.Decimal(12, 2), precio)
            .input('stock', sql.Int, stock)
            .input('categoria', sql.NVarChar, categoria || null)
            .input('empresa_id', sql.Int, empresa_id);

        if (hasMonedaIdColumn) request.input('moneda_id', sql.NVarChar(3), data.moneda_id || 'ARS');

        if (hasSkuColumn && sku !== undefined) request.input('sku', sql.NVarChar, sku || null);
        if (hasCustomFieldsColumn && custom_fields !== undefined) request.input('custom_fields', sql.NVarChar(sql.MAX), cFieldsStr);
        if (hasImageUrlColumn && image_url !== undefined) request.input('image_url', sql.NVarChar(255), image_url || null);

        await request.query(queryStr);
    }

    async delete(pool, id, empresa_id) {
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            await transaction.request().input('id', sql.Int, id).query('DELETE FROM ProductoDepositos WHERE producto_id = @id');
            await transaction.request()
                .input('id', sql.Int, id)
                .input('empresa_id', sql.Int, empresa_id)
                .query(`DELETE FROM Productos WHERE id = @id AND empresa_id = @empresa_id`);
            await transaction.commit();
        } catch (e) {
            if (transaction) await transaction.rollback();
            if (e.message.indexOf('REFERENCE') !== -1 || e.message.indexOf('FOREIGN KEY') !== -1) {
                throw Object.assign(new Error('No se puede eliminar el producto porque tiene histórico de movimientos o ventas. Recomendación: marque el producto como inactivo.'), { statusCode: 400 });
            }
            throw e;
        }
    }
}

module.exports = new ProductoRepository();

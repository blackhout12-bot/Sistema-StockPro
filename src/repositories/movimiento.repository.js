const { sql, connectDB } = require('../config/db');

class MovimientoRepository {
    async getAll(empresa_id) {
        const pool = await connectDB();
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT m.*, p.nombre as producto_nombre 
                FROM Movimientos m
                LEFT JOIN Productos p ON m.productoId = p.id
                WHERE m.empresa_id = @empresa_id
                ORDER BY m.fecha DESC, m.id DESC
            `);
        return result.recordset;
    }

    async getRecent(empresa_id, limite = 5) {
        const pool = await connectDB();
        const result = await pool.request()
            .input('limite', sql.Int, limite)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
        SELECT TOP (@limite) m.id, m.tipo, m.cantidad, m.fecha, p.nombre as producto
        FROM Movimientos m
        INNER JOIN Productos p ON m.productoId = p.id
        WHERE m.empresa_id = @empresa_id
        ORDER BY m.fecha DESC
      `);
        return result.recordset;
    }

    async create(data, usuarioId, empresa_id) {
        const { productoId, tipo, cantidad, deposito_id } = data;
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // 0. Obtener el depósito (usar el enviado o el principal por defecto)
            let actualDepositoId = deposito_id;
            if (!actualDepositoId) {
                const depRes = await transaction.request()
                    .input('empresa_id', sql.Int, empresa_id)
                    .query('SELECT TOP 1 id FROM Depositos WHERE empresa_id = @empresa_id AND es_principal = 1 AND activo = 1');
                if (depRes.recordset.length > 0) {
                    actualDepositoId = depRes.recordset[0].id;
                } else {
                    throw new Error('No se especificó depósito y no hay un depósito principal activo.');
                }
            }

            // 1. Obtener stock actual global and valid tenant ownership
            const prodResult = await transaction.request()
                .input('productoId', sql.Int, productoId)
                .input('empresa_id', sql.Int, empresa_id)
                .query('SELECT stock FROM Productos WITH (UPDLOCK, ROWLOCK) WHERE id = @productoId AND empresa_id = @empresa_id');

            if (prodResult.recordset.length === 0) {
                throw new Error('Producto no encontrado');
            }

            let nuevoStockGlobal = prodResult.recordset[0].stock;

            // Obtener stock específico en el depósito
            const pdResult = await transaction.request()
                .input('pid', sql.Int, productoId)
                .input('did', sql.Int, actualDepositoId)
                .query('SELECT cantidad FROM ProductoDepositos WITH (UPDLOCK, ROWLOCK) WHERE producto_id = @pid AND deposito_id = @did');
            
            let stockEnDeposito = pdResult.recordset.length > 0 ? pdResult.recordset[0].cantidad : 0;
            let nuevoStockDeposito = stockEnDeposito;

            if (tipo === 'entrada') {
                nuevoStockGlobal += cantidad;
                nuevoStockDeposito += cantidad;
            } else if (tipo === 'salida' || tipo === 'ajuste_salida') {
                if (nuevoStockGlobal < cantidad) {
                    throw new Error('Stock global insuficiente para realizar la salida');
                }
                if (nuevoStockDeposito < cantidad) {
                    throw new Error('Stock insuficiente en el depósito seleccionado para realizar la salida');
                }
                nuevoStockGlobal -= cantidad;
                nuevoStockDeposito -= cantidad;
            } else {
                throw new Error('Tipo de movimiento no válido');
            }

            // 2. Actualizar el stock del producto (Global)
            await transaction.request()
                .input('productoId', sql.Int, productoId)
                .input('nuevoStock', sql.Int, nuevoStockGlobal)
                .input('empresa_id', sql.Int, empresa_id)
                .query('UPDATE Productos SET stock = @nuevoStock WHERE id = @productoId AND empresa_id = @empresa_id');

            // 2.1 Actualizar el stock en el depósito específico (ProductoDepositos)
            if (pdResult.recordset.length > 0) {
                await transaction.request()
                    .input('pid', sql.Int, productoId)
                    .input('did', sql.Int, actualDepositoId)
                    .input('nstock', sql.Decimal(18,2), nuevoStockDeposito)
                    .query('UPDATE ProductoDepositos SET cantidad = @nstock, actualizado_en = GETUTCDATE() WHERE producto_id = @pid AND deposito_id = @did');
            } else {
                await transaction.request()
                    .input('pid', sql.Int, productoId)
                    .input('did', sql.Int, actualDepositoId)
                    .input('nstock', sql.Decimal(18,2), nuevoStockDeposito)
                    .query('INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @nstock)');
            }

            // 3. Registrar el movimiento (Resiliente a falta de columnas nro_lote/fecha_vto en tabla Movimientos)
            const hasLoteCol = await transaction.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Movimientos') AND name = 'nro_lote'").then(r => r.recordset.length > 0);
            const hasVtoCol = await transaction.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Movimientos') AND name = 'fecha_vto'").then(r => r.recordset.length > 0);

            let insertQuery = 'INSERT INTO Movimientos (productoId, tipo, cantidad, usuarioId, fecha, empresa_id';
            let valuesQuery = 'VALUES (@productoId, @tipo, @cantidad, @usuarioId, GETDATE(), @empresa_id';

            const movReq = transaction.request()
                .input('productoId', sql.Int, productoId)
                .input('tipo', sql.VarChar, tipo)
                .input('cantidad', sql.Int, cantidad)
                .input('usuarioId', sql.Int, usuarioId)
                .input('empresa_id', sql.Int, empresa_id);

            // Registrar depósitos afectados
            if (tipo === 'entrada') {
                insertQuery += ', deposito_destino_id';
                valuesQuery += ', @actualDepositoId';
                movReq.input('actualDepositoId', sql.Int, actualDepositoId);
            } else {
                insertQuery += ', deposito_origen_id';
                valuesQuery += ', @actualDepositoId';
                movReq.input('actualDepositoId', sql.Int, actualDepositoId);
            }

            if (hasLoteCol && (data.nro_lote || data.lote)) {
                insertQuery += ', nro_lote';
                valuesQuery += ', @nro_lote';
                movReq.input('nro_lote', sql.NVarChar, data.nro_lote || data.lote);
            }
            if (hasVtoCol && data.fecha_vto) {
                insertQuery += ', fecha_vto';
                valuesQuery += ', @fecha_vto';
                movReq.input('fecha_vto', sql.Date, data.fecha_vto);
            }

            insertQuery += ') OUTPUT INSERTED.* ' + valuesQuery + ')';
            const movResult = await movReq.query(insertQuery);

            // 4. Manejo de Lotes (Nuevo)
            if (tipo === 'entrada' && (data.nro_lote !== undefined && data.nro_lote !== null && data.nro_lote !== '')) {
                const loteRepo = require('./lote.repository');
                await loteRepo.create(transaction, {
                    producto_id: productoId,
                    nro_lote: data.nro_lote,
                    cantidad: cantidad,
                    fecha_vto: data.fecha_vto
                }, empresa_id);
            }

            // 5. Notificación si stock bajo
            const stockCheck = await transaction.request()
                .input('productoId', sql.Int, productoId)
                .input('empresa_id', sql.Int, empresa_id)
                .query('SELECT stock, nombre FROM Productos WHERE id = @productoId AND empresa_id = @empresa_id');

            const p = stockCheck.recordset[0];
            // Obtener stock crítico global de la empresa
            const empResult = await transaction.request()
                .input('eid', sql.Int, empresa_id)
                .query('SELECT inv_stock_critico_global FROM Empresa WHERE id = @eid');

            const globalCritico = empResult.recordset[0]?.inv_stock_critico_global || 5;
            const min = globalCritico; // Fallback al global ya que stock_min no existe en la tabla de productos

            if (p.stock <= min) {
                const notifRepo = require('./notificacion.repository');
                await notifRepo.create(transaction, {
                    empresa_id,
                    titulo: 'Alerta de Stock',
                    mensaje: `Stock bajo en ${p.nombre}: quedan ${p.stock} unidades.`,
                    tipo: 'warning'
                });
            }

            await transaction.commit();
            return movResult.recordset[0];
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

module.exports = new MovimientoRepository();

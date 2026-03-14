// src/modules/movimientos/transferencias.controller.js
const { connectDB, sql } = require('../../config/db');
const { deleteCache } = require('../../config/redis');

class TransferenciasController {
    
    async transferir(req, res, next) {
        let transaction;
        try {
            const { empresa_id } = req.user;
            const usuario_id = req.user.id;
            const { origen_id, destino_id, producto_id, cantidad, motivo } = req.body;

            if (!origen_id || !destino_id || !producto_id || !cantidad || cantidad <= 0) {
                return res.status(400).json({ error: 'Faltan parámetros requeridos o cantidad inválida.' });
            }
            if (origen_id === destino_id) {
                return res.status(400).json({ error: 'El depósito origen y destino no pueden ser el mismo.' });
            }

            const pool = await connectDB();
            transaction = new sql.Transaction(pool);
            await transaction.begin();

            // 1. Validar que depósitos y producto pertenezcan a la empresa y existan
            const depCheck = await new sql.Request(transaction)
                .input('eid', sql.Int, empresa_id)
                .input('orig', sql.Int, origen_id)
                .input('dest', sql.Int, destino_id)
                .query('SELECT id FROM Depositos WHERE id IN (@orig, @dest) AND empresa_id = @eid AND activo = 1');
            
            if (depCheck.recordset.length !== 2) {
                throw Object.assign(new Error('Uno o ambos depósitos son inválidos o no pertenecen a la empresa.'), { statusCode: 400 });
            }

            const prodCheck = await new sql.Request(transaction)
                .input('eid', sql.Int, empresa_id)
                .input('pid', sql.Int, producto_id)
                .query('SELECT nombre FROM Productos WHERE id = @pid AND empresa_id = @eid');

            if (prodCheck.recordset.length === 0) {
                throw Object.assign(new Error('Producto inválido.'), { statusCode: 400 });
            }

            // 2. Verificar stock en depósito origen (Con Bloqueo para lectura/escritura)
            const stockCheck = await new sql.Request(transaction)
                .input('pid', sql.Int, producto_id)
                .input('orig', sql.Int, origen_id)
                .query('SELECT cantidad FROM ProductoDepositos WITH (UPDLOCK, ROWLOCK) WHERE producto_id = @pid AND deposito_id = @orig');

            const stockOrigen = stockCheck.recordset.length > 0 ? stockCheck.recordset[0].cantidad : 0;
            if (stockOrigen < cantidad) {
                throw Object.assign(new Error('Stock insuficiente en el depósito de origen.'), { statusCode: 400 });
            }

            // 3. Descontar del origen
            await new sql.Request(transaction)
                .input('pid', sql.Int, producto_id)
                .input('orig', sql.Int, origen_id)
                .input('qty', sql.Decimal(18,2), cantidad)
                .query('UPDATE ProductoDepositos SET cantidad = cantidad - @qty, actualizado_en = GETUTCDATE() WHERE producto_id = @pid AND deposito_id = @orig');

            // 4. Sumar al destino (Insertar si no existe la relación)
            const destStockCheck = await new sql.Request(transaction)
                .input('pid', sql.Int, producto_id)
                .input('dest', sql.Int, destino_id)
                .query('SELECT 1 FROM ProductoDepositos WITH (UPDLOCK, ROWLOCK) WHERE producto_id = @pid AND deposito_id = @dest');

            if (destStockCheck.recordset.length > 0) {
                await new sql.Request(transaction)
                    .input('pid', sql.Int, producto_id)
                    .input('dest', sql.Int, destino_id)
                    .input('qty', sql.Decimal(18,2), cantidad)
                    .query('UPDATE ProductoDepositos SET cantidad = cantidad + @qty, actualizado_en = GETUTCDATE() WHERE producto_id = @pid AND deposito_id = @dest');
            } else {
                await new sql.Request(transaction)
                    .input('pid', sql.Int, producto_id)
                    .input('dest', sql.Int, destino_id)
                    .input('qty', sql.Decimal(18,2), cantidad)
                    .query('INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @dest, @qty)');
            }

            // 5. Registrar en Log de Transferencias
            const logQuery = `
                INSERT INTO TransferenciasStock (empresa_id, deposito_origen_id, deposito_destino_id, producto_id, cantidad, usuario_id, motivo)
                VALUES (@eid, @orig, @dest, @pid, @qty, @uid, @motivo)
            `;
            await new sql.Request(transaction)
                .input('eid', sql.Int, empresa_id)
                .input('orig', sql.Int, origen_id)
                .input('dest', sql.Int, destino_id)
                .input('pid', sql.Int, producto_id)
                .input('qty', sql.Decimal(18,2), cantidad)
                .input('uid', sql.Int, usuario_id)
                .input('motivo', sql.NVarChar(255), motivo || 'Transferencia Interna')
                .query(logQuery);

            // 6. Registrar en el Historial de Movimientos General (Opcional pero recomendado para Trazabilidad)
            // Registramos dos movimientos: Uno de salida del Origen y otro de entrada al Destino
            const movSalidaQuery = `
                INSERT INTO Movimientos (productoId, usuarioId, tipo, cantidad, fecha, empresa_id, deposito_origen_id) 
                VALUES (@pid, @uid, 'transferencia_salida', @qty, GETDATE(), @eid, @orig)
            `;
            const movEntradaQuery = `
                INSERT INTO Movimientos (productoId, usuarioId, tipo, cantidad, fecha, empresa_id, deposito_destino_id) 
                VALUES (@pid, @uid, 'transferencia_entrada', @qty, GETDATE(), @eid, @dest)
            `;
            
            await new sql.Request(transaction)
                .input('pid', sql.Int, producto_id).input('uid', sql.Int, usuario_id).input('qty', sql.Decimal(18,2), cantidad)
                .input('eid', sql.Int, empresa_id).input('orig', sql.Int, origen_id)
                .query(movSalidaQuery);

            await new sql.Request(transaction)
                .input('pid', sql.Int, producto_id).input('uid', sql.Int, usuario_id).input('qty', sql.Decimal(18,2), cantidad)
                .input('eid', sql.Int, empresa_id).input('dest', sql.Int, destino_id)
                .query(movEntradaQuery);

            await transaction.commit();

            // Invalidar caché del Dashboard por si acaso afecta valorizaciones
            await deleteCache(`stats:tenant_${empresa_id}`);

            res.status(200).json({ message: 'Transferencia realizada con éxito.' });
        } catch (error) {
            if (transaction) await transaction.rollback();
            const status = error.statusCode || 500;
            res.status(status).json({ error: error.message || 'Error interno al transferir stock.' });
        }
    }

    async historial(req, res, next) {
        try {
            const { empresa_id } = req.user;
            const pool = await connectDB();
            
            const query = `
                SELECT t.id, t.cantidad, t.motivo, t.creado_en,
                       p.nombre as producto_nombre, p.sku,
                       o.nombre as origen_nombre,
                       d.nombre as destino_nombre,
                       u.nombre as usuario_nombre
                FROM TransferenciasStock t
                JOIN Productos p ON t.producto_id = p.id
                JOIN Depositos o ON t.deposito_origen_id = o.id
                JOIN Depositos d ON t.deposito_destino_id = d.id
                JOIN Usuarios u ON t.usuario_id = u.id
                WHERE t.empresa_id = @eid
                ORDER BY t.creado_en DESC
            `;
            
            const result = await pool.request()
                .input('eid', sql.Int, empresa_id)
                .query(query);
                
            res.json(result.recordset);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TransferenciasController();

const sql = require('mssql');
const logger = require('../utils/logger');

class CompraRepository {
    async getAll(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT c.*, p.razon_social as proveedor_nombre 
                FROM Compras c 
                LEFT JOIN Proveedores p ON c.proveedor_id = p.id 
                WHERE c.empresa_id = @empresa_id 
                ORDER BY c.fecha_compra DESC
            `);
        return result.recordset;
    }

    async getById(pool, id, empresa_id) {
        const reqCompra = pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id);
            
        const queryCompra = `
            SELECT c.*, p.razon_social as proveedor_nombre, p.cuit as proveedor_cuit 
            FROM Compras c 
            LEFT JOIN Proveedores p ON c.proveedor_id = p.id 
            WHERE c.id = @id AND c.empresa_id = @empresa_id
        `;
        const resultCompra = await reqCompra.query(queryCompra);
        if (resultCompra.recordset.length === 0) return null;
        
        const compra = resultCompra.recordset[0];

        const queryDetalle = `
            SELECT cd.*, prod.nombre as producto_nombre 
            FROM Compras_Detalle cd 
            LEFT JOIN Productos prod ON cd.producto_id = prod.id 
            WHERE cd.compra_id = @id
        `;
        const resultDetalle = await pool.request()
            .input('id', sql.Int, id)
            .query(queryDetalle);
            
        compra.detalles = resultDetalle.recordset;
        return compra;
    }

    async create(pool, data, usuario_id, empresa_id) {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Insertar Compra
            const reqCompra = new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('proveedor_id', sql.Int, data.proveedor_id)
                .input('numero_comprobante', sql.NVarChar, data.numero_comprobante)
                .input('tipo_comprobante', sql.NVarChar, data.tipo_comprobante || 'Factura A')
                .input('fecha_compra', sql.DateTime, data.fecha_compra || new Date())
                .input('subtotal', sql.Decimal(18,2), data.subtotal)
                .input('impuestos', sql.Decimal(18,2), data.impuestos || 0)
                .input('total', sql.Decimal(18,2), data.total);

            const resultCompra = await reqCompra.query(`
                INSERT INTO Compras (empresa_id, proveedor_id, numero_comprobante, tipo_comprobante, fecha_compra, subtotal, impuestos, total, estado)
                OUTPUT INSERTED.id
                VALUES (@empresa_id, @proveedor_id, @numero_comprobante, @tipo_comprobante, @fecha_compra, @subtotal, @impuestos, @total, 'COMPLETADA')
            `);
            const compra_id = resultCompra.recordset[0].id;

            // 2. Determinar el Depósito Principal (Si no se manda uno específico)
            let targetDepositoId = null;
            const reqFallback = new sql.Request(transaction).input('emp_id', sql.Int, empresa_id);
            const depRes = await reqFallback.query('SELECT TOP 1 id FROM Depositos WHERE empresa_id = @emp_id AND es_principal = 1 AND activo = 1');
            if (depRes.recordset.length > 0) {
                targetDepositoId = depRes.recordset[0].id;
            }

            // 3. Iterar Detalles
            for (const item of data.detalles) {
                // Instertar Compras_Detalle
                await new sql.Request(transaction)
                    .input('compra_id', sql.Int, compra_id)
                    .input('producto_id', sql.Int, item.producto_id)
                    .input('cantidad', sql.Decimal(18,2), item.cantidad)
                    .input('precio_unitario', sql.Decimal(18,2), item.precio_unitario)
                    .input('subtotal', sql.Decimal(18,2), item.subtotal)
                    .query(`
                        INSERT INTO Compras_Detalle (compra_id, producto_id, cantidad, precio_unitario, subtotal)
                        VALUES (@compra_id, @producto_id, @cantidad, @precio_unitario, @subtotal)
                    `);

                // Actualizar Stock Global
                await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('qty', sql.Decimal(18,2), item.cantidad)
                    .input('eid', sql.Int, empresa_id)
                    .query(`UPDATE Productos SET stock = ISNULL(stock, 0) + @qty WHERE id = @pid AND empresa_id = @eid`);

                // Actualizar Stock en Depósito
                if (targetDepositoId) {
                    const checkDepStock = await new sql.Request(transaction)
                        .input('pid', sql.Int, item.producto_id)
                        .input('did', sql.Int, targetDepositoId)
                        .query('SELECT cantidad FROM ProductoDepositos WHERE producto_id = @pid AND deposito_id = @did');
                    
                    if (checkDepStock.recordset.length === 0) {
                        await new sql.Request(transaction)
                            .input('pid', sql.Int, item.producto_id)
                            .input('did', sql.Int, targetDepositoId)
                            .input('qty', sql.Decimal(18,2), item.cantidad)
                            .query('INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @qty)');
                    } else {
                        await new sql.Request(transaction)
                            .input('pid', sql.Int, item.producto_id)
                            .input('did', sql.Int, targetDepositoId)
                            .input('qty', sql.Decimal(18,2), item.cantidad)
                            .query('UPDATE ProductoDepositos SET cantidad = cantidad + @qty, actualizado_en = GETUTCDATE() WHERE producto_id = @pid AND deposito_id = @did');
                    }
                }

                // Registrar Movimiento
                const reqMov = new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('uid', sql.Int, usuario_id)
                    .input('qty', sql.Decimal(18,2), item.cantidad)
                    .input('eid', sql.Int, empresa_id);

                let movCols = await transaction.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Movimientos')").then(r => r.recordset.map(c => c.name));
                let movFields = ['productoId', 'usuarioId', 'tipo', 'cantidad', 'fecha', 'empresa_id'];
                let movValues = ['@pid', '@uid', "'entrada'", '@qty', 'GETDATE()', '@eid'];

                if (movCols.includes('deposito_destino_id') && targetDepositoId) {
                    movFields.push('deposito_destino_id');
                    movValues.push('@depdest');
                    reqMov.input('depdest', sql.Int, targetDepositoId);
                }

                await reqMov.query(`INSERT INTO Movimientos (${movFields.join(', ')}) VALUES (${movValues.join(', ')})`);

                // Registrar Kardex
                const stockActualRes = await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('eid', sql.Int, empresa_id)
                    .query('SELECT stock FROM Productos WHERE id = @pid AND empresa_id = @eid');
                const saldo_cantidad = stockActualRes.recordset[0].stock;
                
                await new sql.Request(transaction)
                    .input('empresa_id', sql.Int, empresa_id)
                    .input('producto_id', sql.Int, item.producto_id)
                    .input('tipo_movimiento', sql.NVarChar, 'ENTRADA')
                    .input('origen', sql.NVarChar, 'COMPRA')
                    .input('referencia_id', sql.Int, compra_id)
                    .input('cantidad', sql.Decimal(18,2), item.cantidad)
                    .input('costo_unitario', sql.Decimal(18,2), item.precio_unitario)
                    .input('costo_total', sql.Decimal(18,2), item.subtotal)
                    .input('saldo_cantidad', sql.Decimal(18,2), saldo_cantidad)
                    .input('saldo_valorado', sql.Decimal(18,2), saldo_cantidad * item.precio_unitario) // Simplificado, ideal PPP
                    .query(`
                        INSERT INTO Kardex (empresa_id, producto_id, tipo_movimiento, origen, referencia_id, cantidad, costo_unitario, costo_total, saldo_cantidad, saldo_valorado)
                        VALUES (@empresa_id, @producto_id, @tipo_movimiento, @origen, @referencia_id, @cantidad, @costo_unitario, @costo_total, @saldo_cantidad, @saldo_valorado)
                    `);
            }

            // 4. Generar Cuenta por Pagar
            const montoPagar = data.estado_pago === 'PAGADO' ? 0 : data.total;
            const estadoCxp = data.estado_pago === 'PAGADO' ? 'PAGADA' : 'PENDIENTE';
            
            const reqCxp = new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('proveedor_id', sql.Int, data.proveedor_id)
                .input('compra_id', sql.Int, compra_id)
                .input('monto_adeudado', sql.Decimal(18,2), data.total)
                .input('monto_pagado', sql.Decimal(18,2), data.estado_pago === 'PAGADO' ? data.total : 0)
                .input('estado', sql.NVarChar, estadoCxp);

            const resultCxp = await reqCxp.query(`
                INSERT INTO Cuentas_Pagar (empresa_id, proveedor_id, compra_id, monto_adeudado, monto_pagado, estado)
                OUTPUT INSERTED.id
                VALUES (@empresa_id, @proveedor_id, @compra_id, @monto_adeudado, @monto_pagado, @estado)
            `);
            
            // Si está pagado, registrar el pago cruzado
            if (data.estado_pago === 'PAGADO') {
                const cxp_id = resultCxp.recordset[0].id;
                await new sql.Request(transaction)
                    .input('empresa_id', sql.Int, empresa_id)
                    .input('proveedor_id', sql.Int, data.proveedor_id)
                    .input('cuenta_pagar_id', sql.Int, cxp_id)
                    .input('monto_pagado', sql.Decimal(18,2), data.total)
                    .input('metodo_pago', sql.NVarChar, data.metodo_pago || 'Efectivo')
                    .query(`
                        INSERT INTO Pagos (empresa_id, proveedor_id, cuenta_pagar_id, monto_pagado, metodo_pago)
                        VALUES (@empresa_id, @proveedor_id, @cuenta_pagar_id, @monto_pagado, @metodo_pago)
                    `);
            }

            await transaction.commit();
            return compra_id;
        } catch (error) {
            logger.error({ error: error.message, stack: error.stack }, 'Error creating Compra');
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new CompraRepository();

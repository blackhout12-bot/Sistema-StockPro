const sql = require('mssql');

class CuentasPagarRepository {
    async getAll(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT cp.*, p.razon_social as proveedor_nombre, 
                       (cp.monto_adeudado - cp.monto_pagado) as saldo
                FROM Cuentas_Pagar cp
                LEFT JOIN Proveedores p ON cp.proveedor_id = p.id
                WHERE cp.empresa_id = @empresa_id
                ORDER BY cp.estado DESC, cp.fecha_vencimiento ASC
            `);
        return result.recordset;
    }

    async getById(pool, id, empresa_id) {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT cp.*, p.razon_social as proveedor_nombre, 
                       (cp.monto_adeudado - cp.monto_pagado) as saldo
                FROM Cuentas_Pagar cp
                LEFT JOIN Proveedores p ON cp.proveedor_id = p.id
                WHERE cp.id = @id AND cp.empresa_id = @empresa_id
            `);
        if (result.recordset.length === 0) return null;
        
        const cuenta = result.recordset[0];
        
        // Obtener pagos
        const pagosResult = await pool.request()
            .input('cuenta_pagar_id', sql.Int, id)
            .query('SELECT * FROM Pagos WHERE cuenta_pagar_id = @cuenta_pagar_id ORDER BY fecha_pago DESC');
        
        cuenta.pagos = pagosResult.recordset;
        return cuenta;
    }

    async registrarPago(pool, data, empresa_id) {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Verificar cuenta
            const reqCuenta = new sql.Request(transaction)
                .input('id', sql.Int, data.cuenta_pagar_id)
                .input('empresa_id', sql.Int, empresa_id);
            const cuentaRes = await reqCuenta.query('SELECT monto_adeudado, monto_pagado, proveedor_id FROM Cuentas_Pagar WHERE id = @id AND empresa_id = @empresa_id');
            
            if (cuentaRes.recordset.length === 0) throw new Error('Cuenta por pagar no encontrada');
            const cuenta = cuentaRes.recordset[0];
            
            const saldoActual = cuenta.monto_adeudado - cuenta.monto_pagado;
            if (saldoActual <= 0) throw new Error('La cuenta ya está pagada en su totalidad');
            if (data.monto_pagado > saldoActual) throw new Error('El monto a pagar supera el saldo de la deuda');

            // Insertar Pago
            await new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('proveedor_id', sql.Int, cuenta.proveedor_id)
                .input('cuenta_pagar_id', sql.Int, data.cuenta_pagar_id)
                .input('monto_pagado', sql.Decimal(18,2), data.monto_pagado)
                .input('metodo_pago', sql.NVarChar, data.metodo_pago)
                .input('referencia', sql.NVarChar, data.referencia || null)
                .query(`
                    INSERT INTO Pagos (empresa_id, proveedor_id, cuenta_pagar_id, monto_pagado, fecha_pago, metodo_pago, referencia)
                    VALUES (@empresa_id, @proveedor_id, @cuenta_pagar_id, @monto_pagado, GETDATE(), @metodo_pago, @referencia)
                `);

            // Actualizar Cuenta
            const nuevoMontoPagado = cuenta.monto_pagado + data.monto_pagado;
            const nuevoSaldo = cuenta.monto_adeudado - nuevoMontoPagado;
            const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADA' : 'PARCIAL';

            await new sql.Request(transaction)
                .input('id', sql.Int, data.cuenta_pagar_id)
                .input('monto_pagado', sql.Decimal(18,2), nuevoMontoPagado)
                .input('estado', sql.NVarChar, nuevoEstado)
                .query('UPDATE Cuentas_Pagar SET monto_pagado = @monto_pagado, estado = @estado WHERE id = @id');

            await transaction.commit();
            
            // Retornar ID del proveedor para posibles notificaciones o actualizar saldos globales
            return cuenta.proveedor_id;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new CuentasPagarRepository();

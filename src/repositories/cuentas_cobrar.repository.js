const sql = require('mssql');

class CuentasCobrarRepository {
    async getAll(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT cc.*, c.nombre as cliente_nombre, 
                       (cc.monto_adeudado - cc.monto_cobrado) as saldo,
                       f.nro_factura
                FROM Cuentas_Cobrar cc
                LEFT JOIN Clientes c ON cc.cliente_id = c.id
                LEFT JOIN Facturas f ON cc.factura_id = f.id
                WHERE cc.empresa_id = @empresa_id
                ORDER BY cc.estado DESC, cc.fecha_vencimiento ASC
            `);
        return result.recordset;
    }

    async getById(pool, id, empresa_id) {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT cc.*, c.nombre as cliente_nombre, 
                       (cc.monto_adeudado - cc.monto_cobrado) as saldo,
                       f.nro_factura
                FROM Cuentas_Cobrar cc
                LEFT JOIN Clientes c ON cc.cliente_id = c.id
                LEFT JOIN Facturas f ON cc.factura_id = f.id
                WHERE cc.id = @id AND cc.empresa_id = @empresa_id
            `);
        if (result.recordset.length === 0) return null;
        
        const cuenta = result.recordset[0];
        
        // Obtener cobros
        const cobrosResult = await pool.request()
            .input('cuenta_cobrar_id', sql.Int, id)
            .query('SELECT * FROM Cobros WHERE cuenta_cobrar_id = @cuenta_cobrar_id ORDER BY fecha_cobro DESC');
        
        cuenta.cobros = cobrosResult.recordset;
        return cuenta;
    }

    async registrarCobro(pool, data, empresa_id) {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Verificar cuenta
            const reqCuenta = new sql.Request(transaction)
                .input('id', sql.Int, data.cuenta_cobrar_id)
                .input('empresa_id', sql.Int, empresa_id);
            const cuentaRes = await reqCuenta.query('SELECT monto_adeudado, monto_cobrado, cliente_id FROM Cuentas_Cobrar WHERE id = @id AND empresa_id = @empresa_id');
            
            if (cuentaRes.recordset.length === 0) throw new Error('Cuenta por cobrar no encontrada');
            const cuenta = cuentaRes.recordset[0];
            
            const saldoActual = cuenta.monto_adeudado - cuenta.monto_cobrado;
            if (saldoActual <= 0) throw new Error('La cuenta ya está cobrada en su totalidad');
            if (data.monto_cobrado > saldoActual) throw new Error('El monto a cobrar supera el saldo de la deuda');

            // Insertar Cobro
            await new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('cliente_id', sql.Int, cuenta.cliente_id)
                .input('cuenta_cobrar_id', sql.Int, data.cuenta_cobrar_id)
                .input('monto_cobrado', sql.Decimal(18,2), data.monto_cobrado)
                .input('metodo_pago', sql.NVarChar, data.metodo_pago)
                .input('referencia', sql.NVarChar, data.referencia || null)
                .query(`
                    INSERT INTO Cobros (empresa_id, cliente_id, cuenta_cobrar_id, monto_cobrado, fecha_cobro, metodo_pago, referencia)
                    VALUES (@empresa_id, @cliente_id, @cuenta_cobrar_id, @monto_cobrado, GETDATE(), @metodo_pago, @referencia)
                `);

            // Actualizar Cuenta
            const nuevoMontoCobrado = cuenta.monto_cobrado + data.monto_cobrado;
            const nuevoSaldo = cuenta.monto_adeudado - nuevoMontoCobrado;
            const nuevoEstado = nuevoSaldo <= 0 ? 'COBRADA' : 'PARCIAL';

            await new sql.Request(transaction)
                .input('id', sql.Int, data.cuenta_cobrar_id)
                .input('monto_cobrado', sql.Decimal(18,2), nuevoMontoCobrado)
                .input('estado', sql.NVarChar, nuevoEstado)
                .query('UPDATE Cuentas_Cobrar SET monto_cobrado = @monto_cobrado, estado = @estado WHERE id = @id');

            await transaction.commit();
            return cuenta.cliente_id;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new CuentasCobrarRepository();

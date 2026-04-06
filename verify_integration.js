const { connectDB } = require('./src/config/db');
async function verifyIntegration(facturaId) {
    try {
        const pool = await connectDB();
        const results = {};

        // 1. Verificar Factura
        results.factura = (await pool.request().input('fid', facturaId).query('SELECT * FROM Facturas WHERE id = @fid')).recordset[0];

        // 2. Verificar Movimientos
        results.movimientos = (await pool.request().input('fid', facturaId).query('SELECT * FROM Movimientos WHERE productoId = 36 ORDER BY id DESC')).recordset;

        // 3. Verificar Kardex
        results.kardex = (await pool.request().input('fid', facturaId).query('SELECT * FROM Kardex WHERE referencia_id = @fid AND origen = \'VENTA\'')).recordset;

        // 4. Verificar Auditoria
        results.auditoria = (await pool.request().input('fid', facturaId).query('SELECT TOP 5 * FROM Auditoria WHERE entidad_id = @fid AND (entidad = \'Facturacion\' OR entidad = \'Facturas\') ORDER BY id DESC')).recordset;

        // 5. Verificar Cuentas_Cobrar
        results.cuentas_cobrar = (await pool.request().input('fid', facturaId).query('SELECT * FROM Cuentas_Cobrar WHERE factura_id = @fid')).recordset;

        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
verifyIntegration(133);

const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function debugUniqueKey() {
    try {
        const pool = await connectDB();
        console.log('--- DIAGNÓSTICO DE LLAVE ÚNICA ---');

        console.log('\n1. Restricciones en Facturas:');
        const constraints = await pool.request().query(`
        SELECT 
            tc.CONSTRAINT_NAME, 
            tc.CONSTRAINT_TYPE,
            kcu.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        WHERE tc.TABLE_NAME = 'Facturas'
    `);
        console.table(constraints.recordset);

        console.log('\n2. Últimas facturas emitidas:');
        const lastFacts = await pool.request().query("SELECT TOP 5 id, nro_factura, empresa_id, fecha_emision FROM Facturas ORDER BY id DESC");
        console.table(lastFacts.recordset);

        console.log('\n3. Estado de ConfigComprobantes:');
        const configs = await pool.request().query("SELECT id, empresa_id, tipo_comprobante, prefijo, proximo_nro, activo FROM ConfigComprobantes");
        console.table(configs.recordset);

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
debugUniqueKey();

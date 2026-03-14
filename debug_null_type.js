const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function debugNullType() {
    try {
        const pool = await connectDB();
        console.log('--- DIAGNÓSTICO DE TIPO DE COMPROBANTE NULO ---');

        console.log('\n1. Listado completo de ConfigComprobantes (Empresa 1):');
        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE empresa_id = 1");
        console.table(configs.recordset);

        console.log('\n2. Buscando duplicados exactos en Facturas (Top 20):');
        const dups = await pool.request().query(`
        SELECT nro_factura, COUNT(*) as cant
        FROM Facturas 
        GROUP BY nro_factura 
        HAVING COUNT(*) > 1
    `);
        console.table(dups.recordset);

        console.log('\n3. Verificando facturas con formato aleatorio (F...):');
        const randoms = await pool.request().query("SELECT TOP 5 nro_factura FROM Facturas WHERE nro_factura LIKE 'F%' ORDER BY id DESC");
        console.table(randoms.recordset);

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
debugNullType();

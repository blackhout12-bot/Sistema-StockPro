const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function debugUniqueKeyDeep() {
    try {
        const pool = await connectDB();
        console.log('--- AUDITORÍA DE LLAVE ÚNICA (DEEP) ---');

        console.log('\n1. Restricciones:');
        const res = await pool.request().query(`
        SELECT OBJECT_NAME(object_id) AS TableName, name AS IndexName, type_desc, is_unique
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('Facturas') AND is_unique = 1
    `);
        console.log(JSON.stringify(res.recordset, null, 2));

        console.log('\n2. Últimos Nros de Factura:');
        const lastFacts = await pool.request().query("SELECT TOP 10 nro_factura, empresa_id FROM Facturas ORDER BY id DESC");
        console.log(JSON.stringify(lastFacts.recordset, null, 2));

        console.log('\n3. Configuración de Comprobantes:');
        const confs = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE empresa_id = 1");
        console.log(JSON.stringify(confs.recordset, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
debugUniqueKeyDeep();

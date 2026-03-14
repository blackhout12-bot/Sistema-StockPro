const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function checkLastNum() {
    try {
        const pool = await connectDB();
        console.log('--- ÚLTIMO NRO DE FACTURA ---');

        const res = await pool.request().query("SELECT TOP 5 nro_factura FROM Facturas WHERE nro_factura LIKE '0001%' ORDER BY nro_factura DESC");
        console.log(JSON.stringify(res.recordset, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
checkLastNum();

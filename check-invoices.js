const { connectDB, sql } = require('./src/config/db');

async function check() {
    let pool;
    try {
        pool = await connectDB();
        
        console.log('--- INVOICE NUMBER CHECK ---');
        const result = await pool.request().query("SELECT nro_factura FROM Facturas ORDER BY id DESC");
        console.log('Ultimas facturas:', result.recordset.map(r => r.nro_factura));

        const config = await pool.request().query("SELECT * FROM ConfigComprobantes");
        console.log('Configuraciones:', config.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();

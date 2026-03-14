const { connectDB } = require('./src/config/db');
async function test() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Movimientos'");
        console.log("MOVIMIENTOS:", res.recordset);
        const res2 = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Detalle_Facturas'");
        console.log("DETALLES:", res2.recordset);
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}
test();

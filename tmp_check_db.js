const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function check() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Productos')");
        console.log('Productos cols:', res.recordset.map(r => r.name).join(', '));
        const res2 = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Lotes')");
        console.log('Lotes cols:', res2.recordset.map(r => r.name).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();

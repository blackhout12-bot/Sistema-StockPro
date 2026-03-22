const { connectDB } = require('./src/config/db');

async function check() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT id, nombre, es_principal FROM Depositos WHERE empresa_id = 1");
        console.log("DEPOSITOS EMPRESA 1:");
        console.table(res.recordset);
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
}
check();

const { connectDB } = require('./src/config/db');
async function run() {
    try {
        const pool = await connectDB();
        const r = await pool.request().query('SELECT id, dash_kpis_visibles FROM Empresa');
        console.log("DB DATA:", r.recordset);
        process.exit(0);
    } catch(e) { console.error(e); process.exit(1); }
}
run();

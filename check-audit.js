const { connectDB } = require('./src/config/db');
async function run() {
    try {
        const pool = await connectDB();
        const { recordset } = await pool.request().query(`
            SELECT TOP 3 accion, entidad 
            FROM Auditoria 
            WHERE accion IN ('reiniciar_onboarding', 'finalizar_onboarding') 
            ORDER BY id DESC
        `);
        console.log("AUDIT LOGS:", recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();

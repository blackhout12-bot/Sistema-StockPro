const posService = require('./src/modules/pos/pos.service');
const { connectDB, sql } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        
        console.log("Testing POST /pos/sesion/abrir logic...");
        // Fetch User and Caja for Empresa 2
        const userReq = await pool.request().query("SELECT TOP 1 id, empresa_id FROM Usuarios ORDER BY id DESC");
        const user = userReq.recordset[0];
        console.log("Latest User:", user);

        const cajaReq = await pool.request()
            .input('eid', sql.Int, user.empresa_id)
            .query("SELECT TOP 1 id FROM POS_Cajas WHERE empresa_id = @eid");
        const caja = cajaReq.recordset[0];
        console.log("Matching Caja:", caja);

        if (!caja) {
            console.error("No Caja found for user's empresa!");
            process.exit(1);
        }

        console.log("Checking active session...");
        const active = await posService.getSesionActiva(caja.id, user.id);
        console.log("Active Session before:", active);

        console.log("Attempting to open session...");
        const result = await posService.abrirSesion(caja.id, user.id, 100);
        console.log("Opened successfully:", result);
        
        process.exit(0);
    } catch(e) {
        console.error("CRITICAL ERROR IN POS SESSIONS:", e);
        process.exit(1);
    }
})();

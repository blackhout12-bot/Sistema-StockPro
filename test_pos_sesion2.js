const posService = require('./src/modules/pos/pos.service');
const { connectDB, sql } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        
        console.log("Fetching User 2...");
        const userReq = await pool.request().query("SELECT TOP 1 id, empresa_id FROM Usuarios ORDER BY id DESC");
        const user = userReq.recordset[0];

        console.log("Calling getSesionActiva EXACTLY as pos.controller.js does:");
        // In pos.controller.js:
        // const { caja_id } = req.query; => undefined => undefined || null => null
        // const sesion = await posService.getSesionActiva(caja_id || null, req.user.id);
        const sesion = await posService.getSesionActiva(null, user.id);
        
        console.log("RESULT FROM CONTROLLER FLOW:", sesion);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();

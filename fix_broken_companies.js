const { connectDB, sql } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        
        // Find all companies that don't have a Deposit
        const missingDeps = await pool.request().query(`
            SELECT id FROM Empresa e 
            WHERE NOT EXISTS (SELECT 1 FROM Depositos d WHERE d.empresa_id = e.id)
        `);
        
        for (const row of missingDeps.recordset) {
            console.log("Fixing company without deposit:", row.id);
            await pool.request()
              .input('eid', sql.Int, row.id)
              .query("INSERT INTO Depositos (empresa_id, nombre, direccion, es_principal, activo) VALUES (@eid, 'Depósito Principal', 'Central', 1, 1)");
        }
        
        // Find all companies that don't have a Caja POS
        const missingCajas = await pool.request().query(`
            SELECT id FROM Empresa e 
            WHERE NOT EXISTS (SELECT 1 FROM POS_Cajas c WHERE c.empresa_id = e.id)
        `);
        
        for (const row of missingCajas.recordset) {
            console.log("Fixing company without Caja POS:", row.id);
            await pool.request()
              .input('eid', sql.Int, row.id)
              .query("INSERT INTO POS_Cajas (empresa_id, nombre, activa) VALUES (@eid, 'Caja Principal', 1)");
        }

        console.log("Retroactive DB fixes applied successfully.");
        process.exit(0);
    } catch(e) {
        console.error("Error applying fixes:", e);
        process.exit(1);
    }
})();

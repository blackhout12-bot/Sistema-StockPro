const { connectDB } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const empresa_id = 1;
        const tx = await pool.request()
            .input('empresa_id', empresa_id)
            .query(`INSERT INTO POS_Cajas (empresa_id, nombre, activa) OUTPUT INSERTED.* VALUES (@empresa_id, 'Caja Principal Test', 1)`);
        console.log("Insert result:", tx.recordset);
        process.exit(0);
    } catch(e) {
        console.error("SQL Error:", e.message);
        process.exit(1);
    }
})();

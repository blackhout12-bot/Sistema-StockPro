const { connectDB } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT TOP 2 id, nombre, email FROM Usuarios");
        console.log("Usuarios:", res.recordset);
        process.exit(0);
    } catch(e) {
        console.error("SQL Error:", e.message);
        process.exit(1);
    }
})();

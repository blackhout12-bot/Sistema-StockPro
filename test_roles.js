const { connectDB } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT * FROM Roles WHERE codigo_rol = 'admin'");
        console.log("Roles Admin:", res.recordset);
        process.exit(0);
    } catch(e) {
        console.error("SQL Error:", e.message);
        process.exit(1);
    }
})();

const { connectDB } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT * FROM POS_Cajas");
        console.log("Cajas:", res.recordset);
        process.exit(0);
    } catch(e) {
        console.error("SQL Error:", e.message);
        process.exit(1);
    }
})();

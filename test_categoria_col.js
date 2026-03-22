const { connectDB } = require('./src/config/db');
(async () => {
    try {
        const pool = await connectDB();
        await pool.request().query("SELECT top 1 categoria FROM Productos");
        console.log("Categoria column EXISTS!");
        process.exit(0);
    } catch(e) {
        console.error("COLUMN ERROR:", e.message);
        process.exit(1);
    }
})();

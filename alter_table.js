const { connectDB } = require('./src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        await pool.request().query("ALTER TABLE Facturas ALTER COLUMN cliente_id INT NULL");
        console.log("Success");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

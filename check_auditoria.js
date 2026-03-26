const { connectDB } = require('./src/config/db');
async function check() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT TOP 1 * FROM dbo.Auditoria");
        console.log(Object.keys(res.recordset[0] || {}));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
check();

const { connectDB, sql } = require('./src/config/db');
async function check() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Usuarios'");
        console.log(JSON.stringify(res.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
check();

const { connectDB } = require('./src/config/db');
async function run() {
    try {
        const pool = await connectDB();
        const { recordset } = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Usuarios'");
        require('fs').writeFileSync('cols.txt', recordset.map(r=>r.COLUMN_NAME).join(', '));
        console.log('OK');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();

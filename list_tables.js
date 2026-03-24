const { connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        const pool = await connectDB();
        const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        fs.writeFileSync('tables.txt', tables.recordset.map(t => t.TABLE_NAME).join('\\n'));
        console.log("Done");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();

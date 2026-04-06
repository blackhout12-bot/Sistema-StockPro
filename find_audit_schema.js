const { connectDB } = require('./src/config/db');
async function findAuditTable() {
    try {
        const pool = await connectDB();
        const tables = await pool.request().query("SELECT name FROM sys.tables WHERE name LIKE '%Audit%' OR name LIKE '%Log%'");
        console.log('Tables found:', tables.recordset.map(t => t.name));

        for (const table of tables.recordset) {
            const columns = await pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table.name}'`);
            console.log(`Columns in ${table.name}:`, columns.recordset.map(c => c.COLUMN_NAME).join(', '));
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
findAuditTable();

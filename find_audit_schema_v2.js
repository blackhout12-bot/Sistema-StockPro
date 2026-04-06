const { connectDB } = require('./src/config/db');
const fs = require('fs');
async function findAuditSchema() {
    try {
        const pool = await connectDB();
        const results = [];
        const tables = await pool.request().query("SELECT name FROM sys.tables WHERE name LIKE '%Audit%' OR name LIKE '%Log%'");
        
        for (const table of tables.recordset) {
            const columns = await pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table.name}'`);
            results.push({
                table: table.name,
                columns: columns.recordset.map(c => c.COLUMN_NAME)
            });
        }
        fs.writeFileSync('audit_schema_results.json', JSON.stringify(results, null, 2));
        console.log('Results written to audit_schema_results.json');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
findAuditSchema();

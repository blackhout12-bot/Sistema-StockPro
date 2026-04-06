const { connectDB } = require('./src/config/db');
async function listAllIndices() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query(`
            SELECT t.name as Table_Name, i.name as Index_Name
            FROM sys.indexes i
            JOIN sys.tables t ON i.object_id = t.object_id
            WHERE t.name IN ('Facturas', 'Detalle_Facturas') AND i.name IS NOT NULL
        `);
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch(err) {
        process.exit(1);
    }
}
listAllIndices();

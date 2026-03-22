require('dotenv').config();
const { connectDB } = require('./src/config/db');

async function check() {
    try {
        const pool = await connectDB();
        
        // Let's get any check constraints on Movimientos
        const res = await pool.request().query(`
            SELECT 
                cc.name AS ConstraintName,
                c.name AS ColumnName,
                cc.definition AS CheckDefinition
            FROM sys.check_constraints cc
            JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
            WHERE cc.parent_object_id = OBJECT_ID('Movimientos');
        `);
        console.log("Constraints on Movimientos:", res.recordset);

    } catch(e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
check();

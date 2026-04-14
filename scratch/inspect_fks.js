const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        
        console.log('--- Inspecting Constraints for Depositos ---');
        const res = await pool.request().query(`
            SELECT 
                fk.name AS constraint_name,
                OBJECT_NAME(fk.parent_object_id) AS table_name,
                c.name AS column_name,
                OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
                rc.name AS referenced_column
            FROM sys.foreign_keys fk
            INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
            WHERE OBJECT_NAME(fk.parent_object_id) IN ('Depositos', 'Sucursales')
        `);
        console.log(res.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

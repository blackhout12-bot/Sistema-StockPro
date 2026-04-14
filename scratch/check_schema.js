const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        
        console.log('--- Tables ---');
        const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log(tables.recordset.map(r => r.TABLE_NAME));

        console.log('\n--- Constraints (FKs) ---');
        const constraints = await pool.request().query(`
            SELECT 
                parent.name AS table_name,
                fk.name AS constraint_name,
                child.name AS referenced_table
            FROM sys.foreign_keys fk
            INNER JOIN sys.tables parent ON fk.parent_object_id = parent.object_id
            INNER JOIN sys.tables child ON fk.referenced_object_id = child.object_id
        `);
        console.log(constraints.recordset);

        console.log('\n--- Depositos FKs ---');
        const depFKs = await pool.request().query(`
            SELECT 
                fk.name AS constraint_name,
                OBJECT_NAME(fk.parent_object_id) AS table_name,
                OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
                fk.delete_referential_action_desc
            FROM sys.foreign_keys fk
            WHERE OBJECT_NAME(fk.parent_object_id) = 'Depositos'
        `);
        console.log(depFKs.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('Inspeccionando Usuarios...');
        const res = await pool.request().query(`
            SELECT 
                OBJECT_NAME(parent_object_id) AS table_name,
                name AS constraint_name,
                type_desc AS constraint_type
            FROM sys.objects
            WHERE parent_object_id = OBJECT_ID('Usuarios')
        `);
        console.log(res.recordset);
        
        const res2 = await pool.request().query(`
            SELECT 
                fk.name AS fk_name,
                OBJECT_NAME(fk.referenced_object_id) AS referenced_table
            FROM sys.foreign_keys fk
            WHERE fk.parent_object_id = OBJECT_ID('Usuarios')
        `);
        console.log('FKs Out:', res2.recordset);

        const res3 = await pool.request().query(`
            SELECT 
                fk.name AS fk_name,
                OBJECT_NAME(fk.parent_object_id) AS parent_table
            FROM sys.foreign_keys fk
            WHERE fk.referenced_object_id = OBJECT_ID('Usuarios')
        `);
        console.log('FKs In (Dependent Tables):', res3.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

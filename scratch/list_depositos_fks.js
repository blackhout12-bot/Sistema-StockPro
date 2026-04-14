const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        
        console.log('--- Full FK List for Depositos ---');
        const res = await pool.request().query(`
            SELECT 
                fk.name AS constraint_name,
                OBJECT_NAME(fk.referenced_object_id) AS referenced_table
            FROM sys.foreign_keys fk
            WHERE OBJECT_NAME(fk.parent_object_id) = 'Depositos'
        `);
        console.log(res.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

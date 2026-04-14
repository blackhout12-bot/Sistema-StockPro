const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        
        console.log('--- Checking for Orphans ---');
        const orphans1 = await pool.request().query(`
            SELECT * FROM Depositos d
            LEFT JOIN Sucursales s ON d.sucursal_id = s.id
            WHERE d.sucursal_id IS NOT NULL AND s.id IS NULL
        `);
        console.log('Orphaned Depositos (no Sucursal):', orphans1.recordset);

        const orphans2 = await pool.request().query(`
            SELECT * FROM Sucursales s
            LEFT JOIN Empresa e ON s.empresa_id = e.id
            WHERE e.id IS NULL
        `);
        console.log('Orphaned Sucursales (no Empresa):', orphans2.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

const { connectDB, sql } = require('./src/config/db');

async function check() {
    let pool;
    try {
        pool = await connectDB();
        const tables = ['ConfigComprobantes', 'Monedas', 'Facturas', 'Detalle_Facturas'];
        const result = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('${tables.join("','")}')
        `);
        console.log('Tablas encontradas:', result.recordset.map(r => r.TABLE_NAME));

        for (const table of tables) {
            const columns = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}'
            `);
            console.log(`Columnas en ${table}:`, columns.recordset.map(c => c.COLUMN_NAME));
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();

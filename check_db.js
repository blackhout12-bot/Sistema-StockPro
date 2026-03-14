const { connectDB, sql } = require('./src/config/db');

async function check() {
    try {
        const pool = await connectDB();
        console.log('--- VERIFICANDO TABLAS ---');
        const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log('Tablas encontradas:', tables.recordset.map(t => t.TABLE_NAME).join(', '));

        console.log('\n--- VERIFICANDO COLUMNAS DE MOVIMIENTOS ---');
        const movCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Movimientos'");
        if (movCols.recordset.length === 0) {
            console.log('¡ADVERTENCIA! Tabla Movimientos no encontrada.');
        } else {
            console.log('Columnas Movimientos:', movCols.recordset.map(c => c.COLUMN_NAME).join(', '));
        }

        console.log('\n--- VERIFICANDO COLUMNAS DE CONFIG COMPROBANTES ---');
        const compCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ConfigComprobantes'");
        if (compCols.recordset.length === 0) {
            console.log('¡ADVERTENCIA! Tabla ConfigComprobantes no encontrada.');
        } else {
            console.log('Columnas ConfigComprobantes:', compCols.recordset.map(c => c.COLUMN_NAME).join(', '));
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR EN VERIFICACIÓN:');
        console.error(err);
        if (err.number) console.error('SQL Error Number:', err.number);
        if (err.state) console.error('SQL State:', err.state);
        process.exit(1);
    }
}

check();

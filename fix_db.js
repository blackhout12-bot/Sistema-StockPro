const { connectDB, sql } = require('./src/config/db');

async function fix() {
    try {
        const pool = await connectDB();
        console.log('--- APLICANDO COLUMNAS FALTANTES A MOVIMIENTOS ---');

        try {
            await pool.request().query("ALTER TABLE dbo.Movimientos ADD nro_lote NVARCHAR(100) NULL");
            console.log('Columna nro_lote añadida.');
        } catch (e) {
            console.log('Columna nro_lote ya existe o error:', e.message);
        }

        try {
            await pool.request().query("ALTER TABLE dbo.Movimientos ADD fecha_vto DATE NULL");
            console.log('Columna fecha_vto añadida.');
        } catch (e) {
            console.log('Columna fecha_vto ya existe o error:', e.message);
        }

        console.log('--- VERIFICANDO NUEVAMENTE ---');
        const movColumns = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Movimientos'");
        console.log('Columnas finales:', movColumns.recordset.map(c => c.COLUMN_NAME).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('ERROR EN REPARACIÓN:', err);
        process.exit(1);
    }
}

fix();

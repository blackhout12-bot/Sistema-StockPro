const { connectDB } = require('./src/config/db');

async function migrate() {
    console.log('[MIGRATION] Agregando campo rubro a Empresa...');
    const pool = await connectDB();
    try {
        const check = await pool.request().query(`
            SELECT name FROM sys.columns 
            WHERE object_id = OBJECT_ID('Empresa') AND name = 'rubro'
        `);
        if (check.recordset.length > 0) {
            console.log('[MIGRATION] Columna rubro ya existe. Skipping.');
        } else {
            await pool.request().query(`
                ALTER TABLE Empresa ADD rubro NVARCHAR(50) DEFAULT 'general';
            `);
            console.log('[MIGRATION] Columna rubro agregada exitosamente.');
        }
    } catch (e) {
        console.error('[MIGRATION ERROR]', e.message);
    }
    process.exit(0);
}

migrate();

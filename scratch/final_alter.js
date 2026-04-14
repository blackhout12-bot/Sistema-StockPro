const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('--- Ultimo Intento de Alterar Usuarios.empresa_id ---');
        
        // 1. Dropear FK si existe
        try {
            await pool.request().query("ALTER TABLE Usuarios DROP CONSTRAINT FK_Usuario_Empresa");
            console.log('FK_Usuario_Empresa dropped.');
        } catch(e) { console.log('FK_Usuario_Empresa non-existent or failed to drop.'); }

        // 2. Buscar cualquier DEFAULT y dropear
        const defs = await pool.request().query(`
            SELECT name FROM sys.default_constraints 
            WHERE parent_object_id = OBJECT_ID('Usuarios') 
            AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Usuarios'), 'empresa_id', 'ColumnId')
        `);
        for(let d of defs.recordset) {
            await pool.request().query(`ALTER TABLE Usuarios DROP CONSTRAINT ${d.name}`);
            console.log(`Default ${d.name} dropped.`);
        }

        // 3. ALTER COLUMN
        await pool.request().query("ALTER TABLE Usuarios ALTER COLUMN empresa_id INT NULL");
        console.log('✅ Success: Column is now NULLABLE.');

        // 4. Recrear FK
        await pool.request().query("ALTER TABLE Usuarios ADD CONSTRAINT FK_Usuario_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)");
        console.log('FK_Usuario_Empresa recreated.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

run();

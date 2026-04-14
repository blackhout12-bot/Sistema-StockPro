const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('Ajustando empresa_id en Usuarios...');
        await pool.request().query(`
            -- 1. Identificar y dropear FK
            IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuario_Empresa')
                ALTER TABLE Usuarios DROP CONSTRAINT FK_Usuario_Empresa;
            
            -- 2. Hacer nullable
            ALTER TABLE Usuarios ALTER COLUMN empresa_id INT NULL;
            
            -- 3. Recrear FK
            ALTER TABLE Usuarios ADD CONSTRAINT FK_Usuario_Empresa 
            FOREIGN KEY (empresa_id) REFERENCES Empresa(id);
        `);
        console.log('OK');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

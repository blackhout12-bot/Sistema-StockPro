const { connectDB, sql } = require('../src/config/db');

async function run() {
    console.log('--- Iniciando Migración v1.29.7 ---');
    try {
        const pool = await connectDB();
        
        // 1. Ajustar FK_Deposito_Sucursal
        console.log('Ajustando FK_Deposito_Sucursal...');
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Deposito_Sucursal')
                ALTER TABLE dbo.Depositos DROP CONSTRAINT FK_Deposito_Sucursal;
            
            ALTER TABLE dbo.Depositos ADD CONSTRAINT FK_Deposito_Sucursal 
            FOREIGN KEY (sucursal_id) REFERENCES dbo.Sucursales(id) ON DELETE CASCADE;
        `);

        // 2. Ajustar FK_Sucursal_Empresa (para asegurar que borrar empresa borre sucursales)
        console.log('Ajustando FK_Sucursal_Empresa...');
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Sucursal_Empresa')
                ALTER TABLE dbo.Sucursales DROP CONSTRAINT FK_Sucursal_Empresa;

            ALTER TABLE dbo.Sucursales ADD CONSTRAINT FK_Sucursal_Empresa 
            FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE;
        `);

        // 3. Ajustar FK_Depositos_Empresa
        console.log('Ajustando FK_Depositos_Empresa...');
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Depositos_Empresa')
                ALTER TABLE dbo.Depositos DROP CONSTRAINT FK_Depositos_Empresa;

            ALTER TABLE dbo.Depositos ADD CONSTRAINT FK_Depositos_Empresa 
            FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE;
        `);

        // 4. Crear tabla de Backup si no existe (por si acaso)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Backup_Eliminaciones')
            CREATE TABLE Backup_Eliminaciones (
                id INT IDENTITY(1,1) PRIMARY KEY,
                tipo VARCHAR(50),
                data_json NVARCHAR(MAX),
                usuario_ejecutor NVARCHAR(255),
                fecha_eliminacion DATETIME DEFAULT GETDATE()
            );
        `);

        console.log('✅ Migración SQL completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración SQL:', err.message);
        process.exit(1);
    }
}

run();

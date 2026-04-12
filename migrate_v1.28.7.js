const { connectDB, sql } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await connectDB();
        console.log('Conectado a StockDB...');

        // 1. Crear tabla Backup_Eliminaciones
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Backup_Eliminaciones')
            BEGIN
                CREATE TABLE [dbo].[Backup_Eliminaciones] (
                    [id] INT IDENTITY(1,1) PRIMARY KEY,
                    [tipo] NVARCHAR(50), 
                    [data_json] NVARCHAR(MAX),
                    [fecha] DATETIME DEFAULT GETDATE(),
                    [usuario_ejecutor] NVARCHAR(255)
                );
                PRINT 'Tabla Backup_Eliminaciones creada.';
            END
            ELSE PRINT 'La tabla Backup_Eliminaciones ya existe.';
        `);

        // 2. Verificar Auditoria (asumimos que existe por audit.repository.js, pero aseguramos)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Auditoria')
            BEGIN
                CREATE TABLE [dbo].[Auditoria] (
                    [id] INT IDENTITY(1,1) PRIMARY KEY,
                    [empresa_id] INT NULL,
                    [usuario_id] INT NULL,
                    [accion] NVARCHAR(100),
                    [entidad] NVARCHAR(100),
                    [entidad_id] INT NULL,
                    [valor_anterior] NVARCHAR(MAX) NULL,
                    [valor_nuevo] NVARCHAR(MAX) NULL,
                    [ip] NVARCHAR(50) NULL,
                    [trace_id] NVARCHAR(100) NULL,
                    [fecha] DATETIME DEFAULT GETDATE()
                );
                PRINT 'Tabla Auditoria creada.';
            END
            ELSE PRINT 'La tabla Auditoria ya existe.';
        `);

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error en la migración:', err);
        process.exit(1);
    }
}

migrate();

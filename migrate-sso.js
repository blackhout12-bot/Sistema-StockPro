const { connectDB } = require('./src/config/db');

async function runMigration() {
    try {
        const pool = await connectDB();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SSOLog' AND xtype='U')
            BEGIN
                CREATE TABLE SSOLog (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    email NVARCHAR(255) NOT NULL,
                    proveedor NVARCHAR(50) NOT NULL,
                    ip VARCHAR(50) NOT NULL,
                    fecha DATETIME DEFAULT GETDATE(),
                    exito BIT NOT NULL DEFAULT 1,
                    detalles NVARCHAR(MAX)
                );
                PRINT 'Table SSOLog created.';
            END
            ELSE
            BEGIN
                PRINT 'Table SSOLog already exists.';
            END
        `);
        console.log('SSOLog Migration successful');
        process.exit(0);
    } catch (e) {
        console.error('SSOLog Migration failed:', e);
        process.exit(1);
    }
}
runMigration();

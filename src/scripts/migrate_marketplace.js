const sql = require('mssql');
const { connectDB } = require('../config/db');

async function migrate() {
    try {
        const pool = await connectDB();
        console.log('Running marketplace migration...');
        
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmpresaModulos' and xtype='U')
            BEGIN
                CREATE TABLE EmpresaModulos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    empresa_id INT NOT NULL,
                    modulo_id VARCHAR(50) NOT NULL,
                    usuario_id_instalador INT NOT NULL,
                    fecha_instalacion DATETIME DEFAULT GETDATE(),
                    estado VARCHAR(20) DEFAULT 'ACTIVO',
                    CONSTRAINT UQ_Empresa_Modulo UNIQUE (empresa_id, modulo_id)
                );
                PRINT 'Table EmpresaModulos created.';
            END
            ELSE BEGIN
                PRINT 'Table EmpresaModulos already exists.';
            END
        `);
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();

const { connectDB } = require('./src/config/db');

async function checkAudit() {
    try {
        const pool = await connectDB();
        console.log('--- VERIFICANDO AuditLog ---');

        // Verificar si la tabla existe
        const tableCheck = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'AuditLog'
        `);

        if (tableCheck.recordset.length === 0) {
            console.log('¡ERROR! La tabla AuditLog NO existe.');

            console.log('\n--- CREANDO TABLA AuditLog ---');
            await pool.request().query(`
                CREATE TABLE dbo.AuditLog (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    empresa_id INT,
                    usuario_id INT,
                    accion NVARCHAR(100),
                    entidad NVARCHAR(100),
                    entidad_id NVARCHAR(100),
                    payload NVARCHAR(MAX),
                    ip NVARCHAR(50),
                    fecha DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('Tabla AuditLog creada exitosamente.');
        } else {
            console.log('La tabla AuditLog ya existe.');
            const count = await pool.request().query('SELECT COUNT(*) as total FROM AuditLog');
            console.log(`Total de registros en AuditLog: ${count.recordset[0].total}`);

            if (count.recordset[0].total > 0) {
                const logs = await pool.request().query('SELECT TOP 5 * FROM AuditLog ORDER BY fecha DESC');
                console.log('Últimos 5 logs:', JSON.stringify(logs.recordset, null, 2));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

checkAudit();

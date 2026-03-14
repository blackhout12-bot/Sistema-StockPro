const { connectDB } = require('./config/db');

const stmt = `
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditLog]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.AuditLog (
        id              BIGINT PRIMARY KEY IDENTITY(1,1),
        empresa_id      INT,
        usuario_id      INT,
        accion          NVARCHAR(100) NOT NULL,
        entidad         NVARCHAR(100),
        entidad_id      NVARCHAR(100),
        payload         NVARCHAR(MAX),
        ip              NVARCHAR(50),
        fecha           DATETIME2 DEFAULT GETUTCDATE()
    );
END
`;

async function run() {
    try {
        console.log('Conectando a través de db.js...');
        const pool = await connectDB();
        console.log('Ejecutando script AuditLog...');
        await pool.request().query(stmt);
        console.log('✅ AuditLog creado.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    }
}

run();

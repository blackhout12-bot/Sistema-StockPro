const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

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
        console.log('Conectando...');
        const pool = await sql.connect(config);
        console.log('Ejecutando script...');
        await pool.request().query(stmt);
        console.log('✅ Creado AuditLog exitosamente.');
        await pool.close();
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

run();

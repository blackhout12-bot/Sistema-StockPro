// Script temporal para ejecutar la migración con el pool del backend
// node src/migrations/migrate_direct.js
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

const statements = [
    // Identidad visual
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='logo_url') ALTER TABLE Empresa ADD logo_url NVARCHAR(500) NULL",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='sitio_web') ALTER TABLE Empresa ADD sitio_web NVARCHAR(255) NULL",
    // Datos fiscales extendidos
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='pais') ALTER TABLE Empresa ADD pais NVARCHAR(100) NULL",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='ciudad') ALTER TABLE Empresa ADD ciudad NVARCHAR(100) NULL",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='codigo_postal') ALTER TABLE Empresa ADD codigo_postal NVARCHAR(20) NULL",
    // Configuración regional
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='moneda') ALTER TABLE Empresa ADD moneda NVARCHAR(10) NOT NULL CONSTRAINT DF_Empresa_moneda DEFAULT 'ARS'",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='simbolo_moneda') ALTER TABLE Empresa ADD simbolo_moneda NVARCHAR(5) NOT NULL CONSTRAINT DF_Empresa_simbolo DEFAULT '$'",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='zona_horaria') ALTER TABLE Empresa ADD zona_horaria NVARCHAR(100) NOT NULL CONSTRAINT DF_Empresa_zona DEFAULT 'America/Argentina/Buenos_Aires'",
    // Meta del tenant
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='fecha_registro') ALTER TABLE Empresa ADD fecha_registro DATETIME NOT NULL CONSTRAINT DF_Empresa_fecha DEFAULT GETDATE()",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='activo') ALTER TABLE Empresa ADD activo BIT NOT NULL CONSTRAINT DF_Empresa_activo DEFAULT 1",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Empresa') AND name='plan') ALTER TABLE Empresa ADD [plan] NVARCHAR(50) NOT NULL CONSTRAINT DF_Empresa_plan DEFAULT 'starter'",
];

async function run() {
    console.log('Conectando a SQL Server...');
    const pool = await sql.connect(config);

    let ok = 0, skip = 0;
    for (const stmt of statements) {
        try {
            await pool.request().query(stmt);
            console.log('  OK:', stmt.substring(0, 80) + '...');
            ok++;
        } catch (err) {
            if (err.message.includes('already has a constraint') || err.message.includes('Column names in each table must be unique')) {
                console.log('  SKIP (ya existe):', stmt.substring(0, 60));
                skip++;
            } else {
                console.error('  ERROR:', err.message);
                console.error('  SQL:', stmt);
            }
        }
    }

    console.log(`\nResultado: ${ok} ejecutados, ${skip} omitidos.`);
    await pool.close();
}

run().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});

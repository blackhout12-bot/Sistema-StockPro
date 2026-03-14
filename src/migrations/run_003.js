const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: { encrypt: false, trustServerCertificate: true },
};

async function runMigration() {
    const migrationFile = path.join(__dirname, '003_audit_log.sql');
    const sqlScript = fs.readFileSync(migrationFile, 'utf8');

    console.log('Conectando a SQL Server...');
    const pool = await sql.connect(config);

    console.log('Ejecutando migración 003_audit_log.sql...');
    const batches = sqlScript.split(/^\s*GO\s*$/im).filter(b => b.trim());

    for (const batch of batches) {
        if (batch.trim()) {
            await pool.request().query(batch);
        }
    }

    console.log('✅ Migración completada exitosamente.');
    await pool.close();
    process.exit(0);
}

runMigration().catch(console.error);

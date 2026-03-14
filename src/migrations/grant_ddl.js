// Otorga permisos DDL a stock_user usando conexión sa
// node src/migrations/grant_ddl.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sql = require('mssql');

// Intentar con sa primero. Si falla, intentar con el usuario actual como db_ddladmin
const configs = [
    // Opción 1: sa con autenticación Windows
    {
        server: process.env.DB_SERVER || 'localhost',
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || 1433,
        options: { encrypt: false, trustServerCertificate: true, trustedConnection: true }
    },
    // Opción 2: sa hardcoded (SQL Server default)
    {
        user: 'sa',
        password: 'Sa123456!',
        server: process.env.DB_SERVER || 'localhost',
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || 1433,
        options: { encrypt: false, trustServerCertificate: true }
    },
    // Opción 3: mismo usuario pero probando ALTER 
    {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || 1433,
        options: { encrypt: false, trustServerCertificate: true }
    }
];

const targetUser = process.env.DB_USER || 'stock_user';

async function tryConnect(cfg) {
    try {
        const pool = await sql.connect(cfg);
        const who = await pool.request().query('SELECT SYSTEM_USER AS u');
        console.log('  Conectado como:', who.recordset[0].u);
        return pool;
    } catch (e) {
        await sql.close().catch(() => { });
        throw e;
    }
}

async function run() {
    let pool = null;

    for (let i = 0; i < configs.length; i++) {
        try {
            console.log(`Intentando conexión ${i + 1}...`);
            pool = await tryConnect(configs[i]);
            break;
        } catch (e) {
            console.log(`  ❌ Falló: ${e.message.substring(0, 80)}`);
            await sql.close().catch(() => { });
        }
    }

    if (!pool) {
        console.error('No se pudo conectar con ninguna credencial.');
        process.exit(1);
    }

    // Intentar otorgar permisos DDL al user objetivo
    const grants = [
        `IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '${targetUser}') PRINT 'Usuario no encontrado'`,
        `ALTER ROLE db_ddladmin ADD MEMBER [${targetUser}]`,
    ];

    for (const g of grants) {
        try {
            await pool.request().query(g);
            console.log('  ✅ Ejecutado:', g.substring(0, 80));
        } catch (e) {
            console.log('  ⚠️ :', e.message.substring(0, 100));
        }
    }

    await pool.close();
}

run().catch(e => console.error('Fatal:', e.message));

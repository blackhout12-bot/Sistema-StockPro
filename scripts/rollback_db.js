// scripts/rollback_db.js
// ─── TB Gestión ERP: Rollback Interactivo / Automático DB ───
// Usa la variable de entorno RESTORE_MODE (LSN_POINT, SCRIPT_DOWN, SNAPSHOT)

require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'TB_Gestion',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function ejecutarRollbackDb() {
    console.log('⚠️ ALERTA: Iniciando secuencia de Rollback de DB Activa.');
    const pool = new sql.ConnectionPool(config);
    try {
        await pool.connect();
        console.log('✅ Conexión establecida al motor SQL Server.');

        const restoreMode = process.env.RESTORE_MODE || 'SCRIPT_DOWN';

        if (restoreMode === 'SCRIPT_DOWN') {
            const downFile = path.join(__dirname, '../src/migrations/down/rollback_latest.sql');
            if (fs.existsSync(downFile)) {
                const scriptRaw = fs.readFileSync(downFile, 'utf8');
                console.log('⬇️ Ejecutando comandos físicos de Down-Migration...');
                await pool.request().query(scriptRaw);
                console.log('✅ Base de datos revertida exitosamente mediante rollback SQL.');
            } else {
                console.warn('⚠️ No se encontró \'rollback_latest.sql\'. El modo seguro en producción es no alterar el esquema para evitar pérdida de datos transaccionales.');
                console.log('✅ Base de Datos congelada intacta (Rollback Ignorado).');
            }
        } 
        else if (restoreMode === 'SNAPSHOT') {
            console.log('📦 Solicitando Restauración Automática desde el último Snapshot validado...');
            const dbName = config.database;
            // Asume que backup.sh creó \TB_Gestion_safe.bak previo al deploy
            const restoreCMD = `
                USE master;
                ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                RESTORE DATABASE [${dbName}] FROM DISK = '/var/opt/mssql/backup/${dbName}_safe.bak' WITH REPLACE;
                ALTER DATABASE [${dbName}] SET MULTI_USER;
            `;
            await pool.request().query(restoreCMD);
            console.log('✅ Restauración de Snapshot Completada con Éxito DCR.');
        }

    } catch (err) {
        console.error('❌ FATAL: Desajuste del Rollback BD:', err.message);
        process.exit(1);
    } finally {
        await pool.close();
    }
}

ejecutarRollbackDb();

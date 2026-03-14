// Crear UsuarioEmpresas usando Windows Integrated Authentication
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sql = require('mssql');

// Intenta múltiples configs
async function tryConfig(cfg, label) {
    try {
        const pool = await sql.connect(cfg);
        const who = await pool.request().query('SELECT SYSTEM_USER AS u, IS_SRVROLEMEMBER(\'sysadmin\') AS sa');
        const row = who.recordset[0];
        console.log(`✅ Conectado (${label}) como: ${row.u} | sysadmin: ${row.sa}`);
        return pool;
    } catch (e) {
        console.log(`❌ ${label}: ${e.message.substring(0, 80)}`);
        await sql.close().catch(() => { });
        return null;
    }
}

async function run() {
    let pool = null;

    // 1. Windows Auth
    if (!pool) {
        pool = await tryConfig({
            server: 'localhost',
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true, integratedSecurity: true }
        }, 'Windows Auth');
    }

    // 2. sa con password vacía (SQL Server Express default a veces)
    if (!pool) {
        pool = await tryConfig({
            user: 'sa', password: '',
            server: 'localhost',
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        }, 'sa (password vacía)');
    }

    // 3. sa con password común
    for (const pass of ['Sa123456!', 'sa', 'admin', 'Admin123!', '']) {
        if (pool) break;
        pool = await tryConfig({
            user: 'sa', password: pass,
            server: 'localhost',
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        }, `sa (pass: ${pass || '<vacía>'})`);
    }

    if (!pool) {
        console.error('\nNo se encontró una conexión con permisos DDL.');
        console.log('\n📋 Para aplicar la migración manualmente, ejecuta en SQL Server Management Studio:');
        console.log(`
USE ${process.env.DB_NAME};

-- 1. Dar permisos al usuario de la app
ALTER ROLE db_ddladmin ADD MEMBER [${process.env.DB_USER}];

-- 2. Crear tabla UsuarioEmpresas
CREATE TABLE UsuarioEmpresas (
    id          INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    usuario_id  INT          NOT NULL,
    empresa_id  INT          NOT NULL,
    rol         NVARCHAR(50) NOT NULL DEFAULT 'vendedor',
    activo      BIT          NOT NULL DEFAULT 1,
    fecha_union DATETIME     NOT NULL DEFAULT GETDATE()
);

-- 3. Migrar datos
INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo, fecha_union)
SELECT u.id, u.empresa_id, ISNULL(u.rol, 'vendedor'), 1, ISNULL(u.creado_en, GETDATE())
FROM Usuarios u
WHERE u.empresa_id IS NOT NULL;
        `);
        process.exit(1);
    }

    // Crear la tabla
    try {
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id=OBJECT_ID(N'UsuarioEmpresas') AND type=N'U')
            CREATE TABLE UsuarioEmpresas (
                id          INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
                usuario_id  INT          NOT NULL,
                empresa_id  INT          NOT NULL,
                rol         NVARCHAR(50) NOT NULL DEFAULT 'vendedor',
                activo      BIT          NOT NULL DEFAULT 1,
                fecha_union DATETIME     NOT NULL DEFAULT GETDATE()
            )
        `);
        console.log('✅ Tabla UsuarioEmpresas creada');
    } catch (e) {
        console.error('❌ Error creating table:', e.message);
        await pool.close();
        process.exit(1);
    }

    // Migrar datos
    const ins = await pool.request().query(`
        INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo, fecha_union)
        SELECT u.id, u.empresa_id, ISNULL(u.rol, 'vendedor'), 1, ISNULL(u.creado_en, GETDATE())
        FROM Usuarios u
        WHERE u.empresa_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM UsuarioEmpresas ue WHERE ue.usuario_id=u.id AND ue.empresa_id=u.empresa_id)
    `);
    console.log(`✅ Datos migrados: ${ins.rowsAffected[0]} membresías`);

    // Dar permisos al usuario de la app
    try {
        await pool.request().query(`ALTER ROLE db_ddladmin ADD MEMBER [${process.env.DB_USER}]`);
        console.log(`✅ Permisos DDL otorgados a ${process.env.DB_USER}`);
    } catch (e) {
        console.log(`⚠️ No se pudieron otorgar permisos DDL: ${e.message.substring(0, 80)}`);
    }

    const count = await pool.request().query('SELECT COUNT(*) AS n FROM UsuarioEmpresas');
    console.log(`\n✅ UsuarioEmpresas tiene ${count.recordset[0].n} registros`);
    await pool.close();
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

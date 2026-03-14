// Diagnóstico de permisos del usuario DB
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

async function run() {
    const pool = await sql.connect(config);

    // Mostrar usuario actual y sus roles en la DB
    const info = await pool.request().query(`
        SELECT 
            SYSTEM_USER AS login_name,
            USER_NAME() AS db_user,
            IS_MEMBER('db_owner') AS is_db_owner,
            IS_MEMBER('db_ddladmin') AS is_ddladmin,
            IS_MEMBER('db_datawriter') AS is_datawriter,
            IS_MEMBER('db_datareader') AS is_datareader,
            HAS_PERMS_BY_NAME(NULL, 'DATABASE', 'CREATE TABLE') AS can_create_table
    `);

    console.log('=== Permisos del usuario DB ===');
    console.table(info.recordset);

    // Intentar crear una tabla de test
    try {
        await pool.request().query('CREATE TABLE _test_perms (id INT)');
        console.log('✅ CREATE TABLE: SÍ tiene permisos');
        await pool.request().query('DROP TABLE _test_perms');
    } catch (e) {
        console.log('❌ CREATE TABLE: NO tiene permisos —', e.message);
    }

    // Intentar ALTER TABLE existente
    try {
        await pool.request().query(
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Usuarios') AND name='_test_col') ALTER TABLE Usuarios ADD _test_col BIT NULL"
        );
        console.log('✅ ALTER TABLE: SÍ tiene permisos');
        await pool.request().query('ALTER TABLE Usuarios DROP COLUMN _test_col');
    } catch (e) {
        console.log('❌ ALTER TABLE: NO tiene permisos —', e.message);
    }

    await pool.close();
}

run().catch(e => console.error('Fatal:', e.message));

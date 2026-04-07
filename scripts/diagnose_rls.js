const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }
};

async function diagnose() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('✅ Connected to', process.env.DB_NAME);

        // 0. Versión de SQL Server
        const ver = await pool.request().query('SELECT @@VERSION AS version');
        console.log('\n--- SQL Server Version ---');
        console.log(ver.recordset[0].version.split('\n')[0]);

        // 1. Verificar políticas RLS activas (vista correcta para MSSQL 2016+)
        const policies = await pool.request().query(`
            SELECT sp.name AS policy_name, sp.is_enabled, t.name AS table_name
            FROM sys.security_policies sp
            JOIN sys.security_predicates spp ON sp.object_id = spp.object_id
            JOIN sys.tables t ON spp.target_object_id = t.object_id
        `);
        console.log('\n--- RLS Policies Active ---');
        if (policies.recordset.length === 0) {
            console.log('❌ NO RLS POLICIES FOUND! Migration was NOT applied.');
        } else {
            policies.recordset.forEach(p => {
                console.log(`  Policy: ${p.policy_name} | Table: ${p.table_name} | Enabled: ${p.is_enabled}`);
            });
        }

        // 2. Verificar función predicado
        const fn = await pool.request().query(`
            SELECT name FROM sys.objects WHERE name = 'fn_securitypredicate'
        `);
        console.log('\n--- Security Predicate Function ---');
        console.log(fn.recordset.length > 0 ? '✅ fn_securitypredicate EXISTS' : '❌ fn_securitypredicate NOT FOUND');

        // 3. Verificar schema Security
        const schema = await pool.request().query(`SELECT name FROM sys.schemas WHERE name = 'Security'`);
        console.log('\n--- Security Schema ---');
        console.log(schema.recordset.length > 0 ? '✅ Security schema EXISTS' : '❌ Security schema NOT FOUND');

        // 4. Verificar tabla Planes y datos
        const planes = await pool.request().query(`SELECT id, nombre FROM Planes`);
        console.log('\n--- Planes Table ---');
        if (planes.recordset.length === 0) {
            console.log('❌ Planes table is EMPTY');
        } else {
            planes.recordset.forEach(p => console.log(`  ✅ Plan ${p.id}: ${p.nombre}`));
        }

        // 5. Verificar plan_id en Empresa
        const planCol = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Empresa' AND COLUMN_NAME = 'plan_id'
        `);
        console.log('\n--- plan_id in Empresa ---');
        console.log(planCol.recordset.length > 0 ? '✅ plan_id EXISTS in Empresa table' : '❌ plan_id NOT FOUND in Empresa table');

        // 6. Verificar cuántas empresas tienen plan asignado
        if (planCol.recordset.length > 0) {
            const empPlan = await pool.request().query(`
                SELECT e.id, e.nombre, e.plan_id, p.nombre AS plan_nombre
                FROM Empresa e LEFT JOIN Planes p ON e.plan_id = p.id
            `);
            console.log('\n--- Empresa Plan Assignment ---');
            empPlan.recordset.forEach(e => {
                console.log(`  Empresa ${e.id} (${e.nombre || 'sin nombre'}): Plan ${e.plan_id || 'NULL'} (${e.plan_nombre || 'Sin plan'})`);
            });
        }

        // 7. Verificar ModulosActivos
        const maCount = await pool.request().query(`SELECT COUNT(*) AS cnt FROM ModulosActivos`);
        console.log(`\n--- ModulosActivos Table ---`);
        console.log(`  ✅ ${maCount.recordset[0].cnt} records in ModulosActivos`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        if (pool) await pool.close();
    }
}

diagnose();

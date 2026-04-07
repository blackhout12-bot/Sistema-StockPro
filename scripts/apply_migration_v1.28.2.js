/**
 * apply_migration_v1.28.2.js
 * Aplica la migración v1.28.2 (RLS completo en todas las tablas críticas)
 */
const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true },
    pool: { max: 1, min: 1 }
};

// Tablas críticas y sus empresas (para validar que empresa_id existe)
const CRITICAL_TABLES = ['Facturas', 'Clientes', 'Proveedores', 'Auditoria', 'Usuarios'];

async function applyRLS() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('✅ Connected to', process.env.DB_NAME);

        // Verificar que empresa_id existe en cada tabla crítica antes de aplicar RLS
        for (const table of CRITICAL_TABLES) {
            const col = await pool.request().query(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = 'empresa_id'
            `);
            if (col.recordset.length === 0) {
                console.warn(`⚠️  Skipping ${table}: no empresa_id column found`);
                continue;
            }

            // Verificar si ya tiene política
            const existing = await pool.request().query(`
                SELECT name FROM sys.security_policies WHERE name = 'policy_${table}'
            `);
            if (existing.recordset.length > 0) {
                console.log(`⚠️  policy_${table} already exists, skipping.`);
                continue;
            }

            // Aplicar política RLS
            try {
                if (table === 'Usuarios') {
                    // Usuarios: solo FILTER para no romper el auth global
                    await pool.request().query(`
                        CREATE SECURITY POLICY policy_${table}
                        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.${table};
                    `);
                } else {
                    await pool.request().query(`
                        CREATE SECURITY POLICY policy_${table}
                        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.${table},
                        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.${table} AFTER INSERT,
                        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.${table} AFTER UPDATE;
                    `);
                }
                console.log(`✅ RLS applied to: ${table}`);
            } catch (policyErr) {
                console.error(`❌ Failed to apply RLS to ${table}:`, policyErr.message);
            }
        }

        // Verificación final
        const allPolicies = await pool.request().query(`
            SELECT sp.name, sp.is_enabled, t.name AS table_name
            FROM sys.security_policies sp
            JOIN sys.security_predicates spp ON sp.object_id = spp.object_id
            JOIN sys.tables t ON spp.target_object_id = t.object_id
            GROUP BY sp.name, sp.is_enabled, t.name
            ORDER BY t.name
        `);
        console.log('\n=== Active RLS Policies ===');
        allPolicies.recordset.forEach(p => {
            console.log(`  ✅ ${p.name} → table: ${p.table_name} | enabled: ${p.is_enabled}`);
        });

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        if (pool) await pool.close();
    }
}

applyRLS();

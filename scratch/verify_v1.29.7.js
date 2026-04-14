const axios = require('axios');
const { connectDB, sql } = require('../src/config/db');
const authRepo = require('../src/repositories/auth.repository');

// Configuración de prueba
const BACKEND_URL = 'http://localhost:5001/api/v1';
const TEST_EMAIL = 'prueba@prueba.com';
const TEST_PASS = '123456'; // Suponiendo este login

async function verify() {
    console.log('--- Iniciando Verificación v1.29.7 ---');
    try {
        const pool = await connectDB();
        
        // 1. Crear datos de prueba (Manual SQL para mayor control)
        console.log('Creando empresa de prueba...');
        const empRes = await pool.request().query("INSERT INTO Empresa (nombre, documento_identidad, plan_id) OUTPUT INSERTED.id VALUES ('Test Cascading Corp', '123456', 1)");
        const empId = empRes.recordset[0].id;
        
        console.log(`Empresa creada: ${empId}. Creando dependencias...`);
        await pool.request().input('eid', empId).query("INSERT INTO Sucursales (empresa_id, nombre, direccion) VALUES (@eid, 'Sucursal Test', 'Calle Falsa 123')");
        await pool.request().input('eid', empId).query("INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id) VALUES ('User Test', 'test@cascade.com', 'hash', 'admin', @eid)");
        
        // El deposito se crea automáticamente via trigger o manualmente? 
        // SucursalesModel.create lo hace manual. Como inserté directo SQL, lo hago manual:
        const sucRes = await pool.request().input('eid', empId).query("SELECT id FROM Sucursales WHERE empresa_id = @eid");
        const sucId = sucRes.recordset[0].id;
        await pool.request().input('eid', empId).input('sid', sucId).query("INSERT INTO Depositos (empresa_id, sucursal_id, nombre, activo) VALUES (@eid, @sid, 'Deposito Test', 1)");

        console.log('Datos de prueba listos. Verificando conteo inicial...');
        const countBefore = await pool.request().input('eid', empId).query(`
            SELECT 
                (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @eid) as users,
                (SELECT COUNT(*) FROM Sucursales WHERE empresa_id = @eid) as branches,
                (SELECT COUNT(*) FROM Depositos WHERE empresa_id = @eid) as deposits
        `);
        console.log('Antes de borrar:', countBefore.recordset[0]);

        // 2. Ejecutar eliminación vía API (Simulado llamando al repositorio directamente)
        console.log('Ejecutando eliminación profunda (vía repositorio)...');
        const backupId = await authRepo.backupEmpresas([empId], 'system-verificator');
        await authRepo.eliminarEmpresas([empId]);

        console.log(`Eliminación completada. BackupID: ${backupId}. Verificando conteo...`);
        const countAfter = await pool.request().input('eid', empId).query(`
            SELECT 
                (SELECT COUNT(*) FROM Empresa WHERE id = @eid) as empresa,
                (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @eid) as users,
                (SELECT COUNT(*) FROM Sucursales WHERE empresa_id = @eid) as branches,
                (SELECT COUNT(*) FROM Depositos WHERE empresa_id = @eid) as deposits
        `);
        console.log('Después de borrar:', countAfter.recordset[0]);

        if (countAfter.recordset[0].empresa === 0 && countAfter.recordset[0].users === 0) {
            console.log('✅ Eliminación en cascada exitosa.');
        } else {
            console.log('❌ Error: Aún quedan datos.');
        }

        // 3. Rollback
        console.log('Ejecutando Rollback...');
        await authRepo.restaurarBackup(backupId);

        const countRollback = await pool.request().input('eid', empId).query(`
            SELECT 
                (SELECT COUNT(*) FROM Empresa WHERE id = @eid) as empresa,
                (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @eid) as users,
                (SELECT COUNT(*) FROM Sucursales WHERE empresa_id = @eid) as branches,
                (SELECT COUNT(*) FROM Depositos WHERE empresa_id = @eid) as deposits
        `);
        console.log('Post Rollback:', countRollback.recordset[0]);
        
        if (countRollback.recordset[0].empresa === 1 && countRollback.recordset[0].users === 1 && countRollback.recordset[0].branches === 1) {
            console.log('✅ Rollback exitoso.');
        } else {
            console.log('❌ Error en Rollback.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error en verificación:', err);
        process.exit(1);
    }
}

verify();

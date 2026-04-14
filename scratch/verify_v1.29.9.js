const { connectDB, sql } = require('../src/config/db');
const authRepo = require('../src/repositories/auth.repository');

async function verify() {
    console.log('--- Iniciando Verificación v1.29.9 ---');
    const pool = await connectDB();
    
    try {
        // 1. Verificar Purificación de SuperAdmin (Virtual NULL)
        console.log('Verificando purificación de SuperAdmin...');
        const saEmail = `sa_${Date.now()}@test.com`;
        const sa = await authRepo.crearUsuario('Super Test', saEmail, 'hash', 'superadmin', null);
        
        if (sa.empresa_id === null) {
            console.log('✅ SuperAdmin purificado (empresa_id retornado es null).');
        } else {
            console.log('❌ Error: SuperAdmin tiene empresa_id en retorno:', sa.empresa_id);
        }

        // 2. Verificar Deletión en Cascada (Orden Estricto)
        console.log('Verificando eliminación en cascada...');
        const empRes = await pool.request().query("INSERT INTO Empresa (nombre, documento_identidad, plan_id) OUTPUT INSERTED.id VALUES ('Test 1.29.9', '999', 1)");
        const empId = empRes.recordset[0].id;
        
        await pool.request().input('eid', empId).query("INSERT INTO Sucursales (empresa_id, nombre, direccion) VALUES (@eid, 'Suc 99', 'Dir 99')");
        const sucRes = await pool.request().input('eid', empId).query("SELECT id FROM Sucursales WHERE empresa_id = @eid");
        const sucId = sucRes.recordset[0].id;
        await pool.request().input('eid', empId).input('sid', sucId).query("INSERT INTO Depositos (empresa_id, sucursal_id, nombre, activo) VALUES (@eid, @sid, 'Dep 99', 1)");
        await pool.request().input('eid', empId).query("INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id) VALUES ('U 99', 'u99@test.com', 'h', 'admin', @eid)");

        console.log('Ejecutando eliminación...');
        const backupId = await authRepo.backupEmpresas([empId], 'verificador-v1.29.9');
        await authRepo.eliminarEmpresas([empId]);
        
        const count = await pool.request().input('eid', empId).query(`
            SELECT 
                (SELECT COUNT(*) FROM Empresa WHERE id = @eid) as e,
                (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @eid) as u,
                (SELECT COUNT(*) FROM Sucursales WHERE empresa_id = @eid) as s,
                (SELECT COUNT(*) FROM Depositos WHERE empresa_id = @eid) as d
        `);
        const results = count.recordset[0];
        if (results.e === 0 && results.u === 0 && results.s === 0 && results.d === 0) {
            console.log('✅ Eliminación completa exitosa.');
        } else {
            console.log('❌ Error: Quedan datos:', results);
        }

        // 3. Rollback
        console.log('Ejecutando Rollback...');
        await authRepo.restaurarBackup(backupId);
        const countRestored = await pool.request().input('eid', empId).query(`
            SELECT 
                (SELECT COUNT(*) FROM Empresa WHERE id = @eid) as e,
                (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @eid) as u
        `);
        if (countRestored.recordset[0].e === 1) {
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

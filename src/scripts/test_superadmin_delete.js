const { connectDB, sql } = require('../config/db');
const authRepository = require('../repositories/auth.repository');

async function testCascadeDelete() {
    console.log("=== INICIANDO TEST E2E: Eliminación en Cascada ===");
    const pool = await connectDB();
    let empresaId = null;
    
    try {
        // 1. Crear Empresa Fake
        const resEmp = await pool.request().query(`
            INSERT INTO Empresa (nombre, documento_identidad, plan_id) 
            OUTPUT INSERTED.id 
            VALUES ('Empresa Test Cascada', '99999999-9', 1);
        `);
        empresaId = resEmp.recordset[0].id;
        console.log(`✅ Empresa creada (ID: ${empresaId})`);

        // 2. Crear Sucursal Fake
        const resSuc = await pool.request()
            .input('eid', sql.Int, empresaId)
            .query(`
                INSERT INTO Sucursales (empresa_id, nombre, direccion, telefono, activa)
                OUTPUT INSERTED.id
                VALUES (@eid, 'Sucursal Test', 'Dir Test', '123', 1);
            `);
        const sucursalId = resSuc.recordset[0].id;
        console.log(`✅ Sucursal creada (ID: ${sucursalId})`);

        // 3. Crear Depósito Fake
        const resDep = await pool.request()
            .input('eid', sql.Int, empresaId)
            .input('sid', sql.Int, sucursalId)
            .query(`
                INSERT INTO Depositos (empresa_id, sucursal_id, nombre, es_principal, activo)
                OUTPUT INSERTED.id
                VALUES (@eid, @sid, 'Deposito Test', 1, 1);
            `);
        const depositoId = resDep.recordset[0].id;
        console.log(`✅ Depósito creado (ID: ${depositoId})`);

        // 4. Crear Usuario Fake
        const resUsu = await pool.request()
            .input('eid', sql.Int, empresaId)
            .input('sid', sql.Int, sucursalId)
            .query(`
                DECLARE @InsertedRows TABLE (id INT);
                INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id, sucursal_id)
                OUTPUT INSERTED.id INTO @InsertedRows
                VALUES ('User Test', 'testcascade' + CAST(DATEDIFF(s, '1970-01-01', GETUTCDATE()) AS VARCHAR) + '@test.com', 'hash', 'vendedor', @eid, @sid);
                SELECT id FROM @InsertedRows;
            `);
        const usuarioId = resUsu.recordset[0].id;
        console.log(`✅ Usuario creado (ID: ${usuarioId})`);

        // Insertar membresía
        await pool.request()
            .input('uid', sql.Int, usuarioId)
            .input('eid', sql.Int, empresaId)
            .query(`
                INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo)
                VALUES (@uid, @eid, 'vendedor', 1);
            `);
        console.log(`✅ Membresía de usuario creada`);

        // 5. Ejecutar Eliminación en Cascada
        console.log(`⏳ Ejecutando eliminarEmpresas([${empresaId}])...`);
        await authRepository.eliminarEmpresas([empresaId]);
        console.log(`✅ Eliminación ejecutada con éxito (Sin errores de Foreign Key)`);

        // 6. Verificar que todo fue borrado
        const checkEmp = await pool.request().query(`SELECT COUNT(*) as c FROM Empresa WHERE id = ${empresaId}`);
        const checkSuc = await pool.request().query(`SELECT COUNT(*) as c FROM Sucursales WHERE id = ${sucursalId}`);
        const checkDep = await pool.request().query(`SELECT COUNT(*) as c FROM Depositos WHERE id = ${depositoId}`);
        const checkUsu = await pool.request().query(`SELECT COUNT(*) as c FROM Usuarios WHERE id = ${usuarioId}`);

        if (checkEmp.recordset[0].c === 0 && checkSuc.recordset[0].c === 0 && checkDep.recordset[0].c === 0 && checkUsu.recordset[0].c === 0) {
            console.log("🎉 TEST PASSED: Todas las entidades dependientes fueron eliminadas correctamente en cascada.");
        } else {
            console.error("❌ TEST FAILED: Quedaron entidades huérfanas.");
            console.log({
                empresa: checkEmp.recordset[0].c,
                sucursal: checkSuc.recordset[0].c,
                deposito: checkDep.recordset[0].c,
                usuario: checkUsu.recordset[0].c
            });
        }
    } catch (e) {
        console.error("❌ TEST ERROR:", e);
    } finally {
        // Limpieza de emergencia por si falló a medias
        if (empresaId) {
            try {
                await pool.request().query(`DELETE FROM Empresa WHERE id = ${empresaId}`);
            } catch (cleanupErr) {}
        }
        process.exit(0);
    }
}

testCascadeDelete();

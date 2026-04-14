const { connectDB, sql } = require('../src/config/db');
const authRepo = require('../src/repositories/auth.repository');

async function testComplexDeletion() {
    console.log('--- Iniciando Prueba de Estrés: Eliminación Compleja v1.29.10 ---');
    const pool = await connectDB();
    
    try {
        // 1. Crear empresa con datos en multiples niveles
        console.log('Creando empresa de prueba con datos complejos...');
        const empRes = await pool.request().query("INSERT INTO Empresa (nombre, documento_identidad, plan_id) OUTPUT INSERTED.id VALUES ('Empresa Compleja 29.10', 'COMPLEX-10', 1)");
        const empId = empRes.recordset[0].id;

        // Sucursal y Deposito
        const sucRes = await pool.request().input('eid', empId).query("INSERT INTO Sucursales (empresa_id, nombre, direccion) OUTPUT INSERTED.id VALUES (@eid, 'Suc Compleja', 'Dir 10')");
        const sucId = sucRes.recordset[0].id;
        await pool.request().input('eid', empId).input('sid', sucId).query("INSERT INTO Depositos (empresa_id, sucursal_id, nombre, activo) VALUES (@eid, @sid, 'Dep Compleja', 1)");

        // Usuarios y Role
        await pool.request().input('eid', empId).query("INSERT INTO Roles (nombre, codigo_rol, permisos, es_sistema, activo, empresa_id) VALUES ('Rol Test', 'ROL-10', '[]', 0, 1, @eid)");
        const userRes = await pool.request().input('eid', empId).query("INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id) OUTPUT INSERTED.id VALUES ('User Comp', 'comp@test.com', 'h', 'admin', @eid)");
        const userId = userRes.recordset[0].id;

        // Transaccionales (Factura con Detalle)
        const factRes = await pool.request().input('eid', empId).input('uid', userId).query("INSERT INTO Facturas (empresa_id, usuario_id, total, fecha, estado) OUTPUT INSERTED.id VALUES (@eid, @uid, 1000, GETDATE(), 'completada')");
        const factId = factRes.recordset[0].id;
        await pool.request().input('fid', factId).query("INSERT INTO Detalle_Facturas (factura_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (@fid, 1, 1, 1000, 1000)");

        // Maestros (Producto y Cliente)
        await pool.request().input('eid', empId).query("INSERT INTO Productos (nombre, sku, stock, precio, empresa_id) VALUES ('Prod Comp', 'SKU-10', 10, 500, @eid)");
        await pool.request().input('eid', empId).query("INSERT INTO Clientes (nombre, email, empresa_id) VALUES ('Cli Comp', 'cli@test.com', @eid)");

        // Auditoria y Logs
        await pool.request().input('eid', empId).input('uid', userId).query("INSERT INTO Auditoria (empresa_id, usuario_id, accion, entidad) VALUES (@eid, @uid, 'TEST_ACTION', 'TABLE')");

        console.log('✅ Datos complejos insertados. Iniciando Deep Cascade Delete...');
        
        const backupId = await authRepo.backupEmpresas([empId], 'verificador-v1.29.10');
        await authRepo.eliminarEmpresas([empId]);

        console.log('Verificando limpieza...');
        const check = await pool.request().input('eid', empId).query(`
            SELECT 
                (SELECT COUNT(*) FROM Empresa WHERE id = @eid) as e,
                (SELECT COUNT(*) FROM Facturas WHERE empresa_id = @eid) as f,
                (SELECT COUNT(*) FROM Detalle_Facturas WHERE factura_id IN (SELECT id FROM Facturas WHERE empresa_id = @eid)) as df,
                (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @eid) as u,
                (SELECT COUNT(*) FROM Productos WHERE empresa_id = @eid) as p,
                (SELECT COUNT(*) FROM Auditoria WHERE empresa_id = @eid) as a
        `);

        console.log('Resultados:', check.recordset[0]);
        const r = check.recordset[0];
        if (r.e === 0 && r.f === 0 && r.df === 0 && r.u === 0 && r.p === 0 && r.a === 0) {
            console.log('✅ ELIMINACIÓN DEEP CASCADE ÉXITOSA - v1.29.10');
        } else {
            console.log('❌ FALLA: Aún existen datos orfanos.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR FATAL:', err.message);
        process.exit(1);
    }
}

testComplexDeletion();

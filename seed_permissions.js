const { connectDB, sql } = require('./src/config/db');

async function seed() {
    try {
        const pool = await connectDB();
        console.log('--- Limpiando Permisos ---');
        await pool.request().query('DELETE FROM RolPermisos');
        await pool.request().query('DELETE FROM Permisos');
        // DBCC CHECKIDENT removido por falta de permisos de stock_user

        console.log('--- Insertando Permisos ---');
        const permisos = [
            ['productos', 'leer', 'Ver listado'],
            ['productos', 'crear', 'Agregar'],
            ['productos', 'editar', 'Modificar'],
            ['productos', 'eliminar', 'Eliminar'],
            ['inventario', 'leer', 'Ver stock'],
            ['inventario', 'ajustar', 'Ajustar'],
            ['facturacion', 'leer', 'Ver facturas'],
            ['facturacion', 'emitir', 'Emitir'],
            ['facturacion', 'anular', 'Anular'],
            ['clientes', 'leer', 'Ver clientes'],
            ['clientes', 'crear', 'Registrar'],
            ['clientes', 'editar', 'Modificar'],
            ['clientes', 'eliminar', 'Eliminar'],
            ['empresa', 'leer', 'Ver empresa'],
            ['empresa', 'editar', 'Modificar empresa'],
            ['dashboard', 'ver', 'Ver dashboard'],
            ['dashboard', 'leer', 'Ver dashboard'],
            ['dashboard', 'editar', 'Configurar dashboard'],
            ['usuarios', 'administrar', 'Administrar usuarios'],
            ['auditoria', 'ver', 'Ver auditoria'],
            ['reportes', 'leer', 'Ver reportes'],
            ['movimientos', 'leer', 'Ver movimientos'],
            ['movimientos', 'crear', 'Registrar movimientos']
        ];

        for (const [rec, acc, desc] of permisos) {
            await pool.request()
                .input('rec', sql.NVarChar, rec)
                .input('acc', sql.NVarChar, acc)
                .input('desc', sql.NVarChar, desc)
                .query('INSERT INTO Permisos (recurso, accion, descripcion) VALUES (@rec, @acc, @desc)');
        }

        console.log('--- Asignando Permisos ADMIN ---');
        await pool.request().query("INSERT INTO RolPermisos (rol_nombre, permiso_id) SELECT 'admin', id FROM Permisos");

        console.log('--- Asignando Permisos VENDEDOR ---');
        await pool.request().query(`
            INSERT INTO RolPermisos (rol_nombre, permiso_id) 
            SELECT 'vendedor', id FROM Permisos 
            WHERE recurso IN ('productos', 'facturacion', 'clientes', 'movimientos', 'dashboard')
        `);

        console.log('✅ Permisos sembrados correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error sembrando:', err.message);
        process.exit(1);
    }
}

seed();

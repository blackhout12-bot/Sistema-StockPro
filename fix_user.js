const { connectDB, sql } = require('./src/config/db');

async function consolidate() {
    try {
        const pool = await connectDB();
        
        // 1. Identificar IDs
        const res = await pool.query("SELECT id FROM Usuarios WHERE email = 'egar0@example.com'");
        const ids = res.recordset.map(r => r.id);
        console.log('IDs a consolidar:', ids);

        if (ids.length > 0) {
            const primaryId = Math.min(...ids); // Usaremos el ID 1 como primario para el login
            
            // 2. Establecer empresa_id = 2 (la que tiene más datos) para el primario
            await pool.request().input('uid', sql.Int, primaryId).query("UPDATE Usuarios SET empresa_id = 2 WHERE id = @uid");

            // 3. Replicar membresias de todos los IDs al primario
            for (const id of ids) {
                await pool.request().input('oldId', sql.Int, id).input('newId', sql.Int, primaryId).query(`
                    INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo, fecha_union)
                    SELECT @newId, empresa_id, rol, activo, fecha_union
                    FROM UsuarioEmpresas ue
                    WHERE ue.usuario_id = @oldId
                    AND NOT EXISTS (SELECT 1 FROM UsuarioEmpresas ue2 WHERE ue2.usuario_id = @newId AND ue2.empresa_id = ue.empresa_id)
                `);
            }

            // 4. Asegurar empresas 1, 2, 3, 59 para el primario
            const empresas = [1, 2, 3, 59];
            for (const eid of empresas) {
                await pool.request().input('uid', sql.Int, primaryId).input('eid', sql.Int, eid).query(`
                    IF NOT EXISTS (SELECT * FROM UsuarioEmpresas WHERE usuario_id = @uid AND empresa_id = @eid)
                    INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo, fecha_union) VALUES (@uid, @eid, 'admin', 1, GETDATE())
                `);
            }
        }
        
        console.log('CONSOLIDACION_COMPLETA');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
consolidate();

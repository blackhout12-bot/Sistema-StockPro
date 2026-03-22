const { connectDB, sql } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        
        // Find all companies that don't have an 'admin' role in the Roles table
        const missingRoles = await pool.request().query(`
            SELECT id FROM Empresa e 
            WHERE NOT EXISTS (SELECT 1 FROM Roles r WHERE r.empresa_id = e.id AND r.codigo_rol = 'admin')
        `);
        
        for (const row of missingRoles.recordset) {
            console.log("Fixing company without Roles:", row.id);
            await pool.request()
              .input('eid', sql.Int, row.id)
              .input('adminPerm', sql.NVarChar, '{"*":["leer","crear","actualizar","eliminar","exportar"]}')
              .input('gerentePerm', sql.NVarChar, '{"dashboard":["leer"],"facturacion":["leer","crear","exportar"],"movimientos":["leer","crear","actualizar","exportar"],"productos":["leer","crear","actualizar","exportar"],"clientes":["leer","crear","actualizar","exportar"],"reportes":["leer","exportar"]}')
              .input('cajeroPerm', sql.NVarChar, '{"dashboard":["leer"],"facturacion":["leer","crear"],"clientes":["leer","crear"],"movimientos":["leer"]}')
              .query(`
                INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema) VALUES 
                (@eid, 'Administrador', 'admin', @adminPerm, 1),
                (@eid, 'Gerente', 'gerente', @gerentePerm, 1),
                (@eid, 'Cajero', 'cajero', @cajeroPerm, 1)
              `);
        }

        console.log("Retroactive RBAC Roles applied successfully.");
        process.exit(0);
    } catch(e) {
        console.error("Error applying RBAC fixes:", e);
        process.exit(1);
    }
})();

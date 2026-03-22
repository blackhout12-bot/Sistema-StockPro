const { connectDB, sql } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        
        console.log("Updating all english legacy roles to spanish verbs...");
        
        await pool.request().query(`
            UPDATE Roles 
            SET permisos = '{"*":["leer","crear","actualizar","eliminar","exportar"]}'
            WHERE codigo_rol = 'admin' AND permisos LIKE '%"read"%';
        `);

        await pool.request().query(`
            UPDATE Roles 
            SET permisos = '{"dashboard":["leer"],"facturacion":["leer","crear","exportar"],"movimientos":["leer","crear","actualizar","exportar"],"productos":["leer","crear","actualizar","exportar"],"clientes":["leer","crear","actualizar","exportar"],"reportes":["leer","exportar"],"marketplace":["leer","crear","actualizar"],"produccion":["leer","crear","actualizar"],"fidelizacion":["leer","crear","actualizar"]}'
            WHERE codigo_rol = 'gerente' AND permisos LIKE '%"read"%';
        `);

        await pool.request().query(`
            UPDATE Roles 
            SET permisos = '{"dashboard":["leer"],"facturacion":["leer","crear"],"movimientos":["leer","crear","actualizar"],"productos":["leer","crear","actualizar"],"clientes":["leer","crear","actualizar"],"reportes":["leer"],"produccion":["leer","crear"],"fidelizacion":["leer","actualizar"]}'
            WHERE codigo_rol = 'supervisor' AND permisos LIKE '%"read"%';
        `);

        await pool.request().query(`
            UPDATE Roles 
            SET permisos = '{"dashboard":["leer"],"facturacion":["leer","crear"],"clientes":["leer","crear"],"movimientos":["leer"]}'
            WHERE codigo_rol = 'cajero' AND permisos LIKE '%"read"%';
        `);

        await pool.request().query(`
            UPDATE Roles 
            SET permisos = '{"dashboard":["leer"],"movimientos":["leer","crear","actualizar"],"productos":["leer","actualizar"],"produccion":["leer","crear","actualizar","eliminar"]}'
            WHERE codigo_rol = 'gestor_produccion' AND permisos LIKE '%"read"%';
        `);

        await pool.request().query(`
            UPDATE Roles 
            SET permisos = '{"dashboard":["leer"],"clientes":["leer","actualizar"],"fidelizacion":["leer","crear","actualizar"]}'
            WHERE codigo_rol = 'gestor_fidelizacion' AND permisos LIKE '%"read"%';
        `);

        console.log("Legacy RBAC Roles successfully translated to Spanish.");
        process.exit(0);
    } catch(e) {
        console.error("Error migrating english RBAC to spanish:", e);
        process.exit(1);
    }
})();

const { connectDB } = require('../../config/db');
const sql = require('mssql');

class SearchRepository {
    async globalSearch(q, empresa_id, permissions) {
        const pool = await connectDB();
        const searchTerm = `%${q}%`;
        const req = pool.request();
        req.input('emp_id', sql.Int, empresa_id);
        req.input('term', sql.NVarChar, searchTerm);

        const results = {
            productos: [],
            facturas: [],
            clientes: [],
            proveedores: []
        };

        // Productos (Top 5 matches)
        const prodRes = await req.query(`
            SELECT TOP 5 id, nombre, sku, stock 
            FROM Productos 
            WHERE empresa_id = @emp_id 
              AND (nombre LIKE @term OR sku LIKE @term)
        `);
        results.productos = prodRes.recordset;

        // Clientes (Top 5)
        const cliRes = await req.query(`
            SELECT TOP 5 id, nombre, documento_identidad, telefono 
            FROM Clientes 
            WHERE empresa_id = @emp_id 
              AND (nombre LIKE @term OR documento_identidad LIKE @term OR email LIKE @term)
        `);
        results.clientes = cliRes.recordset;

        // Facturas (Top 5)
        if (permissions.fetchFacturas) {
            // Requerimos manejar si existe cliente_nombre_snapshot por robustez
            let hasSnapshots = false;
            try {
                await pool.request().query("SELECT TOP 1 cliente_nombre_snapshot FROM Facturas");
                hasSnapshots = true;
            } catch(e){}

            const qFacturas = hasSnapshots 
                ? `SELECT TOP 5 f.id, f.nro_factura, f.total, ISNULL(f.cliente_nombre_snapshot, c.nombre) as cliente_nombre 
                   FROM Facturas f LEFT JOIN Clientes c ON f.cliente_id = c.id 
                   WHERE f.empresa_id = @emp_id 
                     AND (f.nro_factura LIKE @term OR f.cliente_nombre_snapshot LIKE @term OR c.nombre LIKE @term)`
                : `SELECT TOP 5 f.id, f.nro_factura, f.total, c.nombre as cliente_nombre 
                   FROM Facturas f LEFT JOIN Clientes c ON f.cliente_id = c.id 
                   WHERE f.empresa_id = @emp_id 
                     AND (f.nro_factura LIKE @term OR c.nombre LIKE @term)`;
            
            const factRes = await req.query(qFacturas);
            results.facturas = factRes.recordset;
        }

        // Proveedores (Top 5)
        if (permissions.fetchProveedores) {
            const provRes = await req.query(`
                SELECT TOP 5 id, razon_social as nombre, cuit as documento_identidad 
                FROM Proveedores 
                WHERE empresa_id = @emp_id 
                  AND (razon_social LIKE @term OR cuit LIKE @term)
            `);
            results.proveedores = provRes.recordset;
        }

        return results;
    }
}

module.exports = new SearchRepository();

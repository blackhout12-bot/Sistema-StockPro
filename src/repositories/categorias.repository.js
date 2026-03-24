const sql = require('mssql');

class CategoriasRepository {
    async getCategorias(pool, empresa_id, filtros = {}) {
        let query = `
            SELECT c.*, 
                   e.nombre as empresa_nombre,
                   s.nombre as sucursal_nombre,
                   d.nombre as deposito_nombre
            FROM Categorias c
            LEFT JOIN Empresa e ON c.empresa_id = e.id
            LEFT JOIN Sucursales s ON c.sucursal_id = s.id
            LEFT JOIN Depositos d ON c.deposito_id = d.id
            WHERE c.empresa_id = @empresa_id
        `;
        
        const request = pool.request();
        request.input('empresa_id', sql.Int, empresa_id);

        if (filtros.sucursal_id) {
            query += " AND (c.sucursal_id = @sucursal_id OR c.sucursal_id IS NULL)";
            request.input('sucursal_id', sql.Int, filtros.sucursal_id);
        }

        if (filtros.buscar) {
            query += " AND c.nombre LIKE @buscar";
            request.input('buscar', sql.NVarChar, `%${filtros.buscar}%`);
        }

        if (filtros.activo !== undefined) {
            query += " AND c.activo = @activo";
            request.input('activo', sql.Bit, filtros.activo === 'true' || filtros.activo === true ? 1 : 0);
        }

        query += " ORDER BY c.nombre ASC";

        const result = await request.query(query);
        return result.recordset;
    }

    async getCategoriaById(pool, id, empresa_id) {
        const query = `
            SELECT * FROM Categorias 
            WHERE id = @id AND empresa_id = @empresa_id
        `;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(query);
            
        return result.recordset[0];
    }
    
    async checkUniqueName(pool, nombre, empresa_id, exclude_id = null) {
        let query = "SELECT id FROM Categorias WHERE nombre = @nombre AND empresa_id = @empresa_id";
        const req = pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('empresa_id', sql.Int, empresa_id);
            
        if (exclude_id) {
            query += " AND id != @exclude_id";
            req.input('exclude_id', sql.Int, exclude_id);
        }
        
        const res = await req.query(query);
        return res.recordset.length > 0;
    }

    async createCategoria(pool, data, empresa_id) {
        const query = `
            INSERT INTO Categorias 
            (nombre, descripcion, empresa_id, sucursal_id, deposito_id, activo, creado_en, actualizado_en)
            OUTPUT INSERTED.id
            VALUES 
            (@nombre, @descripcion, @empresa_id, @sucursal_id, @deposito_id, @activo, GETDATE(), GETDATE())
        `;

        const result = await pool.request()
            .input('nombre', sql.NVarChar, data.nombre)
            .input('descripcion', sql.NVarChar, data.descripcion || null)
            .input('empresa_id', sql.Int, empresa_id)
            .input('sucursal_id', sql.Int, data.sucursal_id || null)
            .input('deposito_id', sql.Int, data.deposito_id || null)
            .input('activo', sql.Bit, data.activo !== undefined ? data.activo : 1)
            .query(query);

        return result.recordset[0].id;
    }

    async updateCategoria(pool, id, data, empresa_id) {
        const query = `
            UPDATE Categorias 
            SET nombre = @nombre,
                descripcion = @descripcion,
                sucursal_id = @sucursal_id,
                deposito_id = @deposito_id,
                activo = @activo,
                actualizado_en = GETDATE()
            WHERE id = @id AND empresa_id = @empresa_id
        `;

        await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .input('nombre', sql.NVarChar, data.nombre)
            .input('descripcion', sql.NVarChar, data.descripcion || null)
            .input('sucursal_id', sql.Int, data.sucursal_id || null)
            .input('deposito_id', sql.Int, data.deposito_id || null)
            .input('activo', sql.Bit, data.activo !== undefined ? data.activo : 1)
            .query(query);
            
        return true;
    }

    async deleteCategoria(pool, id, empresa_id) {
        // En un ERP real es mejor baja lógica o verificar restricciones
        // Primero verificamos si hay productos usándola
        const checkProds = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT TOP 1 id FROM Productos WHERE categoria_id = @id");
            
        if (checkProds.recordset.length > 0) {
            throw new Error('No se puede eliminar la categoría porque hay productos asociados a ella.');
        }

        const query = `DELETE FROM Categorias WHERE id = @id AND empresa_id = @empresa_id`;
        await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(query);
            
        return true;
    }
}

module.exports = new CategoriasRepository();

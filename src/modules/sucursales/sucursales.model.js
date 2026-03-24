const sql = require('mssql');
const { connectDB } = require('../../config/db');

class SucursalesModel {
    async getAll(empresa_id) {
        const pool = await connectDB();
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                SELECT id, nombre, direccion, telefono, activa, creado_en 
                FROM Sucursales 
                WHERE empresa_id = @empresa_id
                ORDER BY id ASC
            `);
        return result.recordset;
    }

    async create(empresa_id, data) {
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // 1. Crear Sucursal
            const reqSuc = new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('nombre', sql.VarChar(100), data.nombre)
                .input('direccion', sql.VarChar(255), data.direccion || '')
                .input('telefono', sql.VarChar(50), data.telefono || '')
                .input('activa', sql.Bit, data.activa !== undefined ? data.activa : 1);
            
            const resSuc = await reqSuc.query(`
                INSERT INTO Sucursales (empresa_id, nombre, direccion, telefono, activa)
                OUTPUT INSERTED.id 
                VALUES (@empresa_id, @nombre, @direccion, @telefono, @activa);
            `);
            const sucursal_id = resSuc.recordset[0].id;

            // 2. Crear su Depósito por defecto
            const reqDep = new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('sucursal_id', sql.Int, sucursal_id)
                .input('nombre', sql.VarChar(100), 'Depósito ' + data.nombre)
                .input('es_principal', sql.Bit, 0);

            await reqDep.query(`
                INSERT INTO Depositos (empresa_id, nombre, es_principal, activo, sucursal_id)
                VALUES (@empresa_id, @nombre, @es_principal, 1, @sucursal_id);
            `);

            // 3. Crear su Caja POS por defecto
            const reqCaja = new sql.Request(transaction)
                .input('empresa_id', sql.Int, empresa_id)
                .input('sucursal_id', sql.Int, sucursal_id)
                .input('nombre', sql.VarChar(100), 'Caja ' + data.nombre);
                
            await reqCaja.query(`
                INSERT INTO POS_Cajas (empresa_id, nombre, activa, sucursal_id)
                VALUES (@empresa_id, @nombre, 1, @sucursal_id);
            `);

            await transaction.commit();
            return { id: sucursal_id, ...data };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, empresa_id, data) {
        const pool = await connectDB();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .input('nombre', sql.VarChar(100), data.nombre)
            .input('direccion', sql.VarChar(255), data.direccion || '')
            .input('telefono', sql.VarChar(50), data.telefono || '')
            .input('activa', sql.Bit, data.activa)
            .query(`
                UPDATE Sucursales 
                SET nombre = @nombre, direccion = @direccion, telefono = @telefono, activa = @activa, actualizado_en = GETDATE()
                WHERE id = @id AND empresa_id = @empresa_id
            `);
        return result.rowsAffected[0] > 0;
    }

    async delete(id, empresa_id) {
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Verificar si hay deposito con inventario mayor a 0? 
            // Para mantenerlo simple según fase 3: Borrar Cajas y Deposito (o desactivarlo)
            
            // 1. Eliminar o desactivar POS_Cajas
            await new sql.Request(transaction)
                .input('id', sql.Int, id)
                .input('empresa_id', sql.Int, empresa_id)
                .query("UPDATE POS_Cajas SET estado = 'ELIMINADA' WHERE sucursal_id = @id AND empresa_id = @empresa_id");
            
            // 2. Eliminar o desactivar Depositos
            await new sql.Request(transaction)
                .input('id', sql.Int, id)
                .input('empresa_id', sql.Int, empresa_id)
                .query("UPDATE Depositos SET activo = 0 WHERE sucursal_id = @id AND empresa_id = @empresa_id");

            const result = await new sql.Request(transaction)
                .input('id', sql.Int, id)
                .input('empresa_id', sql.Int, empresa_id)
                .query("DELETE FROM Sucursales WHERE id = @id AND empresa_id = @empresa_id");

            await transaction.commit();
            return result.rowsAffected[0] > 0;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new SucursalesModel();

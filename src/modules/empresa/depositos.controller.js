// src/modules/empresa/depositos.controller.js
const { connectDB, sql } = require('../../config/db');

class DepositosController {
    
    async listar(req, res, next) {
        try {
            const { empresa_id } = req.user;
            const pool = await connectDB();
            
            // Traer todos los depósitos incluyendo la suma de stock guardado para info rápida
            const query = `
                SELECT d.*, 
                       ISNULL((SELECT SUM(cantidad) FROM ProductoDepositos pd WHERE pd.deposito_id = d.id), 0) as stock_total_unidades
                FROM Depositos d
                WHERE d.empresa_id = @eid
                ORDER BY d.es_principal DESC, d.nombre ASC
            `;
            const result = await pool.request().input('eid', sql.Int, empresa_id).query(query);
            
            res.json(result.recordset);
        } catch (error) {
            next(error);
        }
    }

    async obtener(req, res, next) {
        try {
            const { empresa_id } = req.user;
            const { deposito_id } = req.params;
            const pool = await connectDB();
            
            const result = await pool.request()
                .input('eid', sql.Int, empresa_id)
                .input('did', sql.Int, deposito_id)
                .query('SELECT * FROM Depositos WHERE id = @did AND empresa_id = @eid');
                
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Depósito no encontrado.' });
            }
            res.json(result.recordset[0]);
        } catch (error) {
            next(error);
        }
    }

    async crear(req, res, next) {
        try {
            const { empresa_id } = req.user;
            const { nombre, direccion, es_principal, activo } = req.body;
            
            if (!nombre) return res.status(400).json({ error: 'El nombre del depósito es obligatorio.' });

            const pool = await connectDB();
            
            // Manejar lógica de un solo depósito principal
            if (es_principal) {
                await pool.request()
                    .input('eid', sql.Int, empresa_id)
                    .query('UPDATE Depositos SET es_principal = 0 WHERE empresa_id = @eid');
            }

            const query = `
                INSERT INTO Depositos (empresa_id, nombre, direccion, es_principal, activo)
                OUTPUT INSERTED.*
                VALUES (@eid, @nom, @dir, @prin, @act)
            `;
            const result = await pool.request()
                .input('eid', sql.Int, empresa_id)
                .input('nom', sql.NVarChar(100), nombre)
                .input('dir', sql.NVarChar(255), direccion || null)
                .input('prin', sql.Bit, es_principal ? 1 : 0)
                .input('act', sql.Bit, activo !== undefined ? activo : 1)
                .query(query);

            res.status(201).json(result.recordset[0]);
        } catch (error) {
            next(error);
        }
    }

    async actualizar(req, res, next) {
        try {
            const { empresa_id } = req.user;
            const { deposito_id } = req.params;
            const { nombre, direccion, es_principal, activo } = req.body;
            
            const pool = await connectDB();
            
            // Verificar existencia
            const check = await pool.request()
                .input('eid', sql.Int, empresa_id)
                .input('did', sql.Int, deposito_id)
                .query('SELECT es_principal FROM Depositos WHERE id = @did AND empresa_id = @eid');
            
            if (check.recordset.length === 0) return res.status(404).json({ error: 'Depósito no encontrado.' });

            if (es_principal) {
                await pool.request()
                    .input('eid', sql.Int, empresa_id)
                    .query('UPDATE Depositos SET es_principal = 0 WHERE empresa_id = @eid AND id != @did');
            }

            const reqUpdate = pool.request().input('did', sql.Int, deposito_id).input('eid', sql.Int, empresa_id);
            let sets = [];
            
            if (nombre !== undefined) { sets.push('nombre = @nom'); reqUpdate.input('nom', sql.NVarChar(100), nombre); }
            if (direccion !== undefined) { sets.push('direccion = @dir'); reqUpdate.input('dir', sql.NVarChar(255), direccion); }
            if (es_principal !== undefined) { sets.push('es_principal = @prin'); reqUpdate.input('prin', sql.Bit, es_principal ? 1 : 0); }
            if (activo !== undefined) { sets.push('activo = @act'); reqUpdate.input('act', sql.Bit, activo ? 1 : 0); }
            sets.push('actualizado_en = GETUTCDATE()');

            if (sets.length === 1) return res.json(check.recordset[0]); // Solo actualizado_en, nada cambió

            await reqUpdate.query(`UPDATE Depositos SET ${sets.join(', ')} WHERE id = @did AND empresa_id = @eid`);
            
            res.json({ message: 'Depósito actualizado correctamente.' });
        } catch (error) {
            next(error);
        }
    }

    async eliminar(req, res, next) {
        try {
            const { empresa_id } = req.user;
            const { deposito_id } = req.params;
            const pool = await connectDB();
            
            // Regla de Negocio: No se puede eliminar si hay stock o comprobantes usándolo
            const checkProd = await pool.request()
                .input('did', sql.Int, deposito_id)
                .query('SELECT TOP 1 1 FROM ProductoDepositos WHERE deposito_id = @did AND cantidad > 0');
            
            if (checkProd.recordset.length > 0) {
                return res.status(400).json({ error: 'No se puede eliminar el depósito porque aún contiene stock.' });
            }

            // Ocultado lógico para mantener historia de Movimientos y Facturas
            await pool.request()
                .input('did', sql.Int, deposito_id)
                .input('eid', sql.Int, empresa_id)
                .query('UPDATE Depositos SET activo = 0 WHERE id = @did AND empresa_id = @eid AND es_principal = 0');
                
            res.json({ message: 'Depósito desactivado (ocultado).' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DepositosController();

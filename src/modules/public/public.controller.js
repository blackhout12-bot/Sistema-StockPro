// src/modules/public/public.controller.js
const { connectReadOnlyDB } = require('../../config/db');
const sql = require('mssql');

class PublicController {
    
    async getInventory(req, res, next) {
        try {
            const pool = await connectReadOnlyDB();
            // Retorna una lista segura de productos (sin costos de compra u otra info interna)
            const result = await pool.request()
                .input('tenant_id', sql.Int, req.tenant_id)
                .query(`
                    SELECT 
                        p.id, p.codigo, p.nombre, p.descripcion, p.categoria_id, p.marca_id,
                        p.precio_venta, p.stock_total, p.unidad_medida, p.activo, p.imagen_url,
                        p.fecha_actualizacion
                    FROM Productos p
                    WHERE p.empresa_id = @tenant_id AND p.activo = 1
                `);
            
            res.json(result.recordset);
        } catch (error) {
            next(error);
        }
    }

    async getProductStock(req, res, next) {
        try {
            const productId = parseInt(req.params.id);
            if (isNaN(productId)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }

            const pool = await connectReadOnlyDB();
            
            // Verifica primero si el producto pertenece al tenant
            const pResult = await pool.request()
                .input('tenant_id', sql.Int, req.tenant_id)
                .input('id', sql.Int, productId)
                .query('SELECT stock_total FROM Productos WHERE id = @id AND empresa_id = @tenant_id AND activo = 1');
            
            if (pResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
            }

            const stockInfo = {
                producto_id: productId,
                stock_total: pResult.recordset[0].stock_total,
                desglose_depositos: []
            };

            // Obtener stock por depósito
            const dResult = await pool.request()
                .input('tenant_id', sql.Int, req.tenant_id)
                .input('producto_id', sql.Int, productId)
                .query(`
                    SELECT d.id as deposito_id, d.nombre as deposito_nombre, sd.cantidad
                    FROM Stock_Depositos sd
                    JOIN Depositos d ON sd.deposito_id = d.id
                    WHERE sd.producto_id = @producto_id AND d.empresa_id = @tenant_id
                `);

            stockInfo.desglose_depositos = dResult.recordset;

            res.json(stockInfo);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PublicController();

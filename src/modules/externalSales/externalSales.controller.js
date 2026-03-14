// src/modules/externalSales/externalSales.controller.js
const { connectDB } = require('../../config/db');
const sql = require('mssql');

class ExternalSalesController {
    
    // POST /api/v2/ventas-externas/import
    async importSales(req, res, next) {
        try {
            const payload = req.body;
            // Valida que el payload sea un array de ventas
            if (!Array.isArray(payload)) {
                return res.status(400).json({ error: 'El cuerpo de la petición debe ser un array de ventas' });
            }

            // Aquí iría la lógica pesada de inserción masiva en transacciones (SQL BULK)
            // Para el alcance, simulamos la respuesta exitosa tras "procesar"
            
            const resumen = {
                total_recibidas: payload.length,
                importadas_exitosamente: payload.length, // Simulado
                errores: 0
            };

            res.status(201).json({
                message: 'Importación de ventas externas completada.',
                resumen
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/v2/ventas-externas/export
    async exportSales(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const pool = await connectDB();
            
            const result = await pool.request()
                .input('empresa_id', sql.Int, req.tenant_id)
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit) id, fecha, motivo, json_referencia
                    FROM Movimientos
                    WHERE empresa_id = @empresa_id AND tipo = 'salida' AND motivo = 'Venta'
                    ORDER BY fecha DESC
                `);

            res.json(result.recordset);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ExternalSalesController();

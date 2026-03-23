const { connectDB, sql } = require('../../config/db');
const { z } = require('zod');

const olapQuerySchema = z.object({
    anio: z.string().regex(/^\d{4}$/, 'Formato de año inválido').optional(),
    mes: z.string().regex(/^(1[0-2]|[1-9])$/, 'Formato de mes inválido (1-12)').optional(),
    moneda: z.string().min(1).max(10).optional()
}).strict();

class OLAPController {

    // Helper: Registrar la consulta en la tabla de auditoría OLAPLog
    async logOLAPQuery(pool, usuario_id, queryText, executionTime) {
        await pool.request()
            // ... (keep the same below in the file)
            .input('usuario_id', sql.Int, usuario_id)
            .input('consulta', sql.NVarChar(sql.MAX), queryText)
            .input('tiempo', sql.Int, executionTime)
            .query(`
                INSERT INTO OLAPLog (usuario_id, consulta, tiempo_ejecucion_ms)
                VALUES (@usuario_id, @consulta, @tiempo)
            `);
    }

    // 1. Cubo de Ventas (Querying the Pre-calculated Materialized View)
    async getSalesCube(req, res, next) {
        try {
            // Validate GET queries synchronously before db bind
            const q = olapQuerySchema.parse(req.query);

            const startMark = performance.now();
            const pool = await connectDB();

            // Filtrar y cortar el Cubo OLAP dinámicamente según req.query
            // Ej: /api/olap/ventas?anio=2026&mes=3
            let sqlQuery = `SELECT * FROM vw_CuboVentas WHERE empresa_id = @empresa_id`;
            const reqPool = pool.request().input('empresa_id', req.tenant_id);

            if (req.query.anio) {
                sqlQuery += ` AND anio = @anio`;
                reqPool.input('anio', sql.Int, parseInt(req.query.anio));
            }
            if (req.query.mes) {
                sqlQuery += ` AND mes = @mes`;
                reqPool.input('mes', sql.Int, parseInt(req.query.mes));
            }
            if (req.query.moneda) {
                sqlQuery += ` AND moneda = @moneda`;
                reqPool.input('moneda', sql.NVarChar(10), req.query.moneda);
            }

            const result = await reqPool.query(sqlQuery);
            
            const endMark = performance.now();
            const execTime = Math.round(endMark - startMark);

            // Inyectar Logging inmutable de la operación de inteligencia
            await this.logOLAPQuery(pool, req.user.id, sqlQuery, execTime);

            res.json({
                slice: req.query,
                time_ms: execTime,
                cube_data: result.recordset
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OLAPController();

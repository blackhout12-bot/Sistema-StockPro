const { connectDB, sql } = require('../../config/db');

class OLAPController {

    // Helper: Registrar la consulta en la tabla de auditoría OLAPLog
    async logOLAPQuery(pool, usuario_id, queryText, executionTime) {
        await pool.request()
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

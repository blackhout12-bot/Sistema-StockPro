const { connectDB } = require('../../config/db');

class BIController {

    // 1. Exportar KPIs Financieros (Retorno para Power BI / Metabase)
    async exportFinancialKPIs(req, res, next) {
        try {
            const pool = await connectDB();
            
            // El chequeo de permisos (RBAC dinámico) se maneja en el middleware de bi.routes.js

            // Consultar Múltiples Tablas y Consolidar en formato Analítico Flat
            const result = await pool.request()
                .input('empresa_id', req.tenant_id)
                .query(`
                    SELECT 
                        ISNULL(SUM(f.total * f.tasa_cambio), 0) AS ingresos_brutos_ars,
                        COUNT(DISTINCT f.cliente_id) AS clientes_activos,
                        ISNULL(SUM(CASE WHEN f.estado = 'Pendiente' THEN (f.total * f.tasa_cambio) ELSE 0 END), 0) AS cuentas_por_cobrar_ars,
                        GETDATE() AS fecha_corte
                    FROM Facturas f
                    WHERE f.empresa_id = @empresa_id AND f.estado != 'Anulada'
                `);

            // Devuelve JSON estructurado que M (PowerQuery) y Power BI absorben fácil
            res.json({
                tenant: req.tenant_id,
                metrics: result.recordset[0]
            });

        } catch (error) {
            next(error);
        }
    }

    // 2. Exportar Rotación Operativa (Inventory Turnover)
    async exportOperationalKPIs(req, res, next) {
        try {
            const pool = await connectDB();

            // El chequeo de permisos (RBAC dinámico) se maneja en el middleware de bi.routes.js

            // Consultar métricas de alta rotación (Movimientos Salida vs Stock Actual)
            const result = await pool.request()
                .input('empresa_id', req.tenant_id)
                .query(`
                    SELECT 
                        p.categoria_id,
                        SUM(p.stock) as stock_inmovilizado,
                        SUM(ABS(m.cantidad)) as volumen_movido_30d
                    FROM Productos p
                    LEFT JOIN Movimientos m ON p.id = m.producto_id 
                        AND m.fecha >= DATEADD(day, -30, GETDATE()) 
                        AND m.tipo = 'salida'
                    WHERE p.empresa_id = @empresa_id
                    GROUP BY p.categoria_id
                `);

            res.json({
                tenant: req.tenant_id,
                metrics: result.recordset
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BIController();

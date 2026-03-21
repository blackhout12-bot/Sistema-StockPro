const { connectDB } = require('../../config/db');
const sql = require('mssql');
const notificationService = require('../../services/notification.service');
const { linearRegression, linearRegressionLine } = require('simple-statistics');

class AIController {

    // 1. Predicción de demanda (Machine Learning)
    async predictDemand(req, res, next) {
        try {
            const product_id = parseInt(req.params.id);
            if (isNaN(product_id)) return res.status(400).json({ error: 'ID inválido' });

            const pool = await connectDB();
            
            // Extraer la serie temporal cronológica (ventas agrupadas por día de los últimos 60 días)
            const historialRes = await pool.request()
                .input('empresa_id', sql.Int, req.tenant_id)
                .input('producto_id', sql.Int, product_id)
                .query(`
                    SELECT 
                        DATEDIFF(day, MIN(fecha) OVER(), fecha) as dia_relativo,
                        ISNULL(SUM(ABS(cantidad)), 0) as vendidos 
                    FROM Movimientos 
                    WHERE empresa_id = @empresa_id 
                      AND producto_id = @producto_id 
                      AND tipo = 'salida' 
                      AND fecha >= DATEADD(day, -60, GETDATE())
                    GROUP BY fecha
                    ORDER BY fecha ASC
                `);
            
            const registros = historialRes.recordset;

            if (registros.length < 3) {
                 return res.json({
                    producto_id: product_id,
                    demanda_esperada_proximo_mes: 0,
                    sugerencia: 'Datos insuficientes para que la IA elabore una predicción confiable (se requieren más de 3 días de ventas).'
                });
            }

            // Preparar tuple array para simple-statistics: [x (dia relativo), y (ventas)]
            const trainingData = registros.map(r => [r.dia_relativo, r.vendidos]);

            // ML Training: Mínimos cuadrados (Linear Regression)
            const regressionModel = linearRegression(trainingData);
            const prediccionLinea = linearRegressionLine(regressionModel);

            // Proyectar el consumo de los próximos 30 días
            const ultimoDiaConocido = registros[registros.length - 1].dia_relativo;
            let ventasProyectadas30Dias = 0;
            
            for (let i = 1; i <= 30; i++) {
                const prediccionDiaria = prediccionLinea(ultimoDiaConocido + i);
                // No predecir ventas negativas
                if (prediccionDiaria > 0) ventasProyectadas30Dias += prediccionDiaria; 
            }

            const ventasPasadas = registros.reduce((sum, r) => sum + r.vendidos, 0);
            const pendiente = regressionModel.m;

            let sugerencia_negocio = '';
            if (pendiente > 0.5) {
                sugerencia_negocio = `TENDENCIA ALCISTA CRÍTICA: La IA proyecta vender ${Math.ceil(ventasProyectadas30Dias)} uds. Aumente el reabastecimiento habitual.`;
            } else if (pendiente < -0.2) {
                sugerencia_negocio = `TENDENCIA BAJISTA: El consumo se está estancando. Se sugieren pautas de Marketing para rotar stock. Predicción a 30 días: ${Math.ceil(ventasProyectadas30Dias)} uds.`;
            } else {
                sugerencia_negocio = `ESTABLE: Mantener el reabastecimiento normal para cubrir la proyección IA de ${Math.ceil(ventasProyectadas30Dias)} uds en 30 días.`;
            }
            
            res.json({
                producto_id: product_id,
                analisis_dias: 60,
                ventas_pasadas_60dias: ventasPasadas,
                tendencia_crecimiento_diario: parseFloat(pendiente.toFixed(2)),
                demanda_esperada_proximo_mes: Math.ceil(ventasProyectadas30Dias),
                sugerencia: sugerencia_negocio
            });

        } catch (error) {
            console.error("\n💥 [AI Controller] Predict Error:", error);
            next(error);
        }
    }

    // 2. Alertas de Vencimiento y sugerencia de ofertas preventivas
    async checkExpirations(req, res, next) {
        try {
            const pool = await connectDB();
            
            // Buscar lotes que vencen en los próximos 15 días
            const lotesRes = await pool.request()
                .input('empresa_id', sql.Int, req.tenant_id)
                .query(`
                    SELECT id, producto_id, nro_lote, cantidad, fecha_vto
                    FROM Lotes
                    WHERE empresa_id = @empresa_id 
                      AND fecha_vto IS NOT NULL 
                      AND cantidad > 0
                      AND fecha_vto <= DATEADD(day, 15, GETDATE())
                `);
            
            const alertas = lotesRes.recordset.map(lote => {
                const msPerDay = 1000 * 60 * 60 * 24;
                const diasRestantes = Math.ceil((new Date(lote.fecha_vto) - new Date()) / msPerDay);
                let sugerencia = '';
                if (diasRestantes <= 5) {
                    sugerencia = `URGENTE: Lote ${lote.nro_lote} vence en ${diasRestantes} días. Sugerencia IA: Aplicar descuento 50%.`;
                } else {
                    sugerencia = `Atención: Lote ${lote.nro_lote} vence en ${diasRestantes} días. Sugerencia IA: Crear promoción de rotación (2x1).`;
                }
                
                return {
                    lote_id: lote.id,
                    producto_id: lote.producto_id,
                    numero_lote: lote.nro_lote,
                    dias_restantes: diasRestantes,
                    sugerencia_preventiva: sugerencia
                };
            });

            // Disparar notificaciones si hay urgencias (Mock)
            if (alertas.some(a => a.dias_restantes <= 5)) {
                await notificationService.sendPushNotification({
                    title: '¡Alerta de Vencimiento Crítica!',
                    body: 'Tienes lotes que expiran en menos de 5 días. Revisa las recomendaciones AI.'
                }, req.tenant_id);
            }

            res.json({
                total_alertas: alertas.length,
                analisis: alertas
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AIController();

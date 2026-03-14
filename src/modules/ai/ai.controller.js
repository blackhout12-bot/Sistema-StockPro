// src/modules/ai/ai.controller.js
const { connectDB } = require('../../config/db');
const sql = require('mssql');
const notificationService = require('../../services/notification.service');

class AIController {

    // 1. Predicción de demanda
    async predictDemand(req, res, next) {
        try {
            const product_id = parseInt(req.params.id);
            if (isNaN(product_id)) return res.status(400).json({ error: 'ID inválido' });

            const pool = await connectDB();
            // Analizar historial de ventas (Movimientos salida por Venta)
            const historialRes = await pool.request()
                .input('empresa_id', sql.Int, req.tenant_id)
                .input('producto_id', sql.Int, product_id)
                .query(`
                    SELECT ISNULL(SUM(ABS(cantidad)), 0) as total_vendido_30_dias 
                    FROM Movimientos 
                    WHERE empresa_id = @empresa_id 
                      AND producto_id = @producto_id 
                      AND tipo = 'salida' 
                      AND motivo = 'Venta'
                      AND fecha >= DATEADD(day, -30, GETDATE())
                `);
            
            const vendidos = historialRes.recordset[0].total_vendido_30_dias;
            
            // Algoritmo predictivo simple (Media móvil simple)
            const sugerencia_reposicion = Math.ceil(vendidos * 1.2); // Proyectar 20% más por factor de seguridad
            
            res.json({
                producto_id: product_id,
                analisis_dias: 30,
                ventas_pasadas: vendidos,
                demanda_esperada_proximo_mes: sugerencia_reposicion,
                sugerencia: sugerencia_reposicion > 0 ? `Recomendamos reabastecer ${sugerencia_reposicion} unidades para cubrir la demanda proyectada.` : 'Stock estable, no requiere reposición inminente.'
            });

        } catch (error) {
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
                    SELECT id, producto_id, numero_lote, cantidad_actual, fecha_vencimiento
                    FROM Lotes
                    WHERE empresa_id = @empresa_id 
                      AND fecha_vencimiento IS NOT NULL 
                      AND cantidad_actual > 0
                      AND fecha_vencimiento <= DATEADD(day, 15, GETDATE())
                `);
            
            const alertas = lotesRes.recordset.map(lote => {
                const msPerDay = 1000 * 60 * 60 * 24;
                const diasRestantes = Math.ceil((new Date(lote.fecha_vencimiento) - new Date()) / msPerDay);
                let sugerencia = '';
                if (diasRestantes <= 5) {
                    sugerencia = `URGENTE: Lote ${lote.numero_lote} vence en ${diasRestantes} días. Sugerencia IA: Aplicar descuento 50%.`;
                } else {
                    sugerencia = `Atención: Lote ${lote.numero_lote} vence en ${diasRestantes} días. Sugerencia IA: Crear promoción de rotación (2x1).`;
                }
                
                return {
                    lote_id: lote.id,
                    producto_id: lote.producto_id,
                    numero_lote: lote.numero_lote,
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

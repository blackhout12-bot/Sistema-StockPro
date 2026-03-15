// src/workers/cronWorker.js
const { Worker } = require('bullmq');
const { redisConnectionParams } = require('../config/redis');
const logger = require('../utils/logger');
const { connectDB, sql } = require('../config/db');
const notificacionRepo = require('../repositories/notificacion.repository');
const { emailQueue } = require('../config/queue');

/**
 * Worker para tareas recurrentes.
 * Refactoriza la lógica de alertWorker.js para que sea administrada por BullMQ.
 */
const cronWorker = new Worker('cron-jobs', async job => {
    logger.info({ jobId: job.id, type: job.name }, 'Ejecutando Cron Job...');

    if (job.name === 'check-stock-vencimientos') {
        const result = await processorCheckStock();
        return result;
    }

    if (job.name === 'weekly-report') {
        // Implementación futura
        return { message: 'Weekly report no implementado aún' };
    }

    throw new Error('Tipo de cron-job desconocido');
}, { connection: redisConnectionParams });

cronWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, err: err.message }, 'Cron Job falló!');
});

// ─── LÓGICA DE ALERTAS MIGRADAS ──────────────────────────────────────────

async function processorCheckStock() {
    let alertasGeneradas = 0;
    try {
        const pool = await connectDB();

        // 1. Empresas con alertas habilitadas
        const empresasConfig = await pool.request().query(`
            SELECT id AS empresa_id, inv_alertas_habilitadas
            FROM Empresa 
            WHERE inv_alertas_habilitadas = 1
        `);

        for (let config of empresasConfig.recordset) {
            const empresaId = config.empresa_id;

            const adminEmailsReq = await pool.request()
                .input('emp_id', sql.Int, empresaId)
                .query(`
                    SELECT u.email 
                    FROM Usuarios u
                    JOIN UsuarioEmpresas ue ON u.id = ue.usuario_id
                    WHERE ue.empresa_id = @emp_id AND ue.rol = 'admin' AND ue.activo = 1
                `);
            const adminEmails = adminEmailsReq.recordset.map(u => u.email);

            if (adminEmails.length === 0) continue;

            const stockBajoReq = await pool.request().input('empresa_id', sql.Int, empresaId).query(`
                SELECT id, nombre, stock, 
                       CASE WHEN COL_LENGTH('Productos', 'sku') IS NOT NULL THEN sku ELSE NULL END as sku,
                       CASE WHEN COL_LENGTH('Productos', 'stock_min') IS NOT NULL THEN stock_min ELSE 0 END as stock_min
                FROM Productos 
                WHERE empresa_id = @empresa_id 
                AND stock <= (CASE WHEN COL_LENGTH('Productos', 'stock_min') IS NOT NULL THEN stock_min ELSE 5 END)
                  AND (CASE WHEN COL_LENGTH('Productos', 'stock_min') IS NOT NULL THEN stock_min ELSE 5 END) > 0
            `);

            let lotesPorVencer = [];
            try {
                const lotesReq = await pool.request().input('empresa_id', sql.Int, empresaId).query(`
                    SELECT l.nro_lote, l.cantidad, l.fecha_vto, p.nombre
                    FROM Lotes l
                    JOIN Productos p ON l.producto_id = p.id
                    WHERE l.empresa_id = @empresa_id AND l.cantidad > 0 AND l.fecha_vto <= DATEADD(day, 15, GETDATE())
                `);
                lotesPorVencer = lotesReq.recordset;
            } catch (e) { }

            if (stockBajoReq.recordset.length > 0 || lotesPorVencer.length > 0) {
                alertasGeneradas++;
                let textContent = `Resumen de Alertas de Inventario:\n\n`;

                if (stockBajoReq.recordset.length > 0) {
                    textContent += `--- PRODUCTOS CON STOCK BAJO ---\n`;
                    stockBajoReq.recordset.forEach(p => {
                        textContent += `- ${p.nombre} (SKU: ${p.sku || 'N/A'}) - Stock: ${p.stock} (Mínimo requerido: ${p.stock_min})\n`;
                    });
                    textContent += `\n`;
                }

                if (lotesPorVencer.length > 0) {
                    textContent += `--- LOTES PRÓXIMOS A VENCER O VENCIDOS ---\n`;
                    lotesPorVencer.forEach(l => {
                        textContent += `- Lote: ${l.nro_lote} | Producto: ${l.nombre} | Cantidad: ${l.cantidad} | Vencimiento: ${new Date(l.fecha_vto).toLocaleDateString()}\n`;
                    });
                }

                await notificacionRepo.create(pool, {
                    empresa_id: empresaId,
                    titulo: 'Alerta de Inventario Crítica',
                    mensaje: textContent.substring(0, 1000),
                    tipo: 'warning'
                });

                // ENVIAR AL COLA DE EMAILS EN VEZ DE ENVIAR DIRECTO
                await emailQueue.add('alerta-stock', {
                    to: adminEmails.join(','),
                    subject: '🚨 Alertas de Inventario: Stock Mínimo y Vencimientos',
                    text: textContent
                }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
            }
        }
        return { procesadas: empresasConfig.recordset.length, alertasGeneradas };
    } catch (err) {
        logger.error({ error: err.message }, 'Error en logic de cronWorker');
        throw err;
    }
}

cronWorker.on('error', (err) => {
    // Silenced for graceful degradation when Redis is offline.
});

module.exports = cronWorker;

// src/utils/webhook.service.js
const { sql } = require('../config/db');
const { webhookQueue } = require('../config/queue');
const logger = require('./logger');

/**
 * Despacha un evento a todos los webhooks suscritos de una empresa.
 * @param {number} empresaId 
 * @param {string} evento Nombre del evento (ej: 'stock.updated')
 * @param {object} payload Datos del evento
 */
async function notifyEvent(empresaId, evento, payload) {
    try {
        // 1. Buscar webhooks suscritos para esta empresa y evento
        const pool = await sql;
        const result = await pool.request()
            .input('empresaId', sql.Int, empresaId)
            .input('evento', sql.NVarChar, evento)
            .query(`
                SELECT id, url_destino, secret_token 
                FROM Webhooks 
                WHERE empresa_id = @empresaId 
                  AND evento = @evento 
                  AND activo = 1
            `);

        const webhooks = result.recordset;

        if (webhooks.length === 0) {
            return;
        }

        // 2. Encolar un trabajo para cada webhook
        for (const wh of webhooks) {
            await webhookQueue.add(`deliver-${evento}-${wh.id}`, {
                webhookId: wh.id,
                url: wh.url_destino,
                secret: wh.secret_token,
                evento,
                payload,
                timestamp: new Date().toISOString()
            }, {
                attempts: 5, // Reintentar hasta 5 veces si el cliente falla
                backoff: {
                    type: 'exponential',
                    delay: 5000 // Iniciar con 5 segundos de espera
                }
            });
        }

        logger.info({ empresaId, evento, count: webhooks.length }, 'Eventos de webhook encolados para entrega');
    } catch (err) {
        logger.error({ err, empresaId, evento }, 'Error al encolar webhooks');
    }
}

module.exports = {
    notifyEvent
};

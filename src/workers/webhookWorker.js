// src/workers/webhookWorker.js
const { Worker } = require('bullmq');
const { redisConnectionParams } = require('../config/redis');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Worker encargado de realizar los POSTs hacia los servidores externos.
 */
const webhookWorker = new Worker('webhooks', async job => {
    const { url, secret, evento, payload, timestamp } = job.data;

    logger.info({ url, evento, jobId: job.id }, 'Iniciando entrega de webhook');

    const body = JSON.stringify({
        event: evento,
        data: payload,
        timestamp
    });

    // Calcular firma de seguridad si existe un secret
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'StockSystem-Webhook-Worker/1.0',
        'X-Stock-Event': evento
    };

    if (secret) {
        const signature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        headers['X-Stock-Signature'] = signature;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
            timeout: 10000 // 10 segundos de timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        logger.info({ url, evento, status: response.status }, 'Webhook entregado exitosamente');
        return { status: response.status, ok: true };
    } catch (err) {
        logger.error({ err: err.message, url, evento }, 'Error entregando webhook');
        // Lanzar error para que BullMQ gestione el reintento automático
        throw err;
    }
}, { 
    connection: redisConnectionParams,
    concurrency: 5 // Procesar hasta 5 entregas simultáneas
});

webhookWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, err: err.message }, 'Entrega de webhook falló definitivamente tras reintentos');
});

module.exports = webhookWorker;

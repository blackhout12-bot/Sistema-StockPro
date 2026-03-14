// src/config/queue.js
const { Queue } = require('bullmq');
const { redisConnectionParams } = require('./redis');

// Cola para Emails y notificaciones externas
const emailQueue = new Queue('emails', { connection: redisConnectionParams });
emailQueue.on('error', (err) => { /* Silenced for graceful degradation */ });

// Cola para Tareas Programadas (Cron Jobs)
const cronQueue = new Queue('cron-jobs', { connection: redisConnectionParams });
cronQueue.on('error', (err) => {});

// Cola genérica para procesamiento pesado (Ej: Importaciones CSV o Reportes PDF enormes)
const heavyQueue = new Queue('heavy-tasks', { connection: redisConnectionParams });
heavyQueue.on('error', (err) => {});

// Cola para Webhooks (Integraciones externas)
const webhookQueue = new Queue('webhooks', { connection: redisConnectionParams });
webhookQueue.on('error', (err) => {});

// Cola para AFIP (Facturación Electrónica)
const afipQueue = new Queue('afip-authorization', { connection: redisConnectionParams });
afipQueue.on('error', (err) => {});

module.exports = {
    emailQueue,
    cronQueue,
    heavyQueue,
    webhookQueue,
    afipQueue
};

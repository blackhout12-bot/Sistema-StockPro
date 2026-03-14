// src/config/queue.js
const { Queue } = require('bullmq');
const { redisConnectionParams } = require('./redis');

// Cola para Emails y notificaciones externas
const emailQueue = new Queue('emails', { connection: redisConnectionParams });

// Cola para Tareas Programadas (Cron Jobs)
const cronQueue = new Queue('cron-jobs', { connection: redisConnectionParams });

// Cola genérica para procesamiento pesado (Ej: Importaciones CSV o Reportes PDF enormes)
const heavyQueue = new Queue('heavy-tasks', { connection: redisConnectionParams });

// Cola para Webhooks (Integraciones externas)
const webhookQueue = new Queue('webhooks', { connection: redisConnectionParams });

// Cola para AFIP (Facturación Electrónica)
const afipQueue = new Queue('afip-authorization', { connection: redisConnectionParams });

module.exports = {
    emailQueue,
    cronQueue,
    heavyQueue,
    webhookQueue,
    afipQueue
};

// src/workers/emailWorker.js
const { Worker } = require('bullmq');
const { redisConnectionParams } = require('../config/redis');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

// Reutilizamos el transporte actual (Idealmente mover a config/mailer.js luego)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'alerts@stock-system.local',
        pass: process.env.SMTP_PASS || 'password'
    }
});

const emailWorker = new Worker('emails', async job => {
    logger.info({ jobId: job.id, type: job.name }, 'Procesando tarea de Email en Background');
    
    const { to, subject, html, text } = job.data;

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'no-reply@stock-system.com',
            to,
            subject,
            text,
            html
        });
        logger.info({ messageId: info.messageId, to }, 'Email enviado exitosamente vía Worker');
        return info;
    } catch (error) {
        logger.error({ error: error.message, to }, 'Error enviando email en Worker');
        throw error; // Lanzar error para que BullMQ gestione reintentos
    }
}, { 
    connection: redisConnectionParams,
    concurrency: 5, // Enviar hasta 5 correos simultáneos
    limiter: {
        max: 50, // Max 50 emails
        duration: 1000 // por segundo (rate limiting simple de SMTP)
    }
});

emailWorker.on('completed', job => {
    logger.debug({ jobId: job.id }, 'Job email completado');
});

emailWorker.on('failed', (job, err) => {
    logger.error({ jobId: job ? job.id : 'unknown', err: err.message }, 'Job email falló');
});

emailWorker.on('error', (err) => {
    // Silenced for graceful degradation when Redis is offline.
});

module.exports = emailWorker;

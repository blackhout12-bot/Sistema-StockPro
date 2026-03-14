const { cronQueue } = require('../../config/queue');
const logger = require('../../utils/logger');

// Para mantener compatibilidad si algo lo importa, pero ya no usa node-cron
logger.info('alertWorker (Legacy) importado. Las tareas ahora son administradas por BullMQ cronQueue.');

/**
 * Función manual para inicializar el job repetitivo en la cola de BullMQ.
 * Esto se llama una vez al arranque del servidor.
 */
async function initAlertJobs() {
    try {
        const cronTime = process.env.NODE_ENV === 'production' ? '0 1 * * *' : '*/5 * * * *';
        
        // Agregamos un Repeatable Job a la cola
        await cronQueue.add('check-stock-vencimientos', {}, {
            repeat: { pattern: cronTime },
            jobId: 'check-stock-vencimientos-job' // Evita duplicados
        });
        
        logger.info({ cronTime }, 'Cron Job [check-stock-vencimientos] registrado en BullMQ.');
    } catch (e) {
        logger.error({ error: e.message }, 'Error registrando Cron Job en BullMQ');
    }
}

module.exports = { initAlertJobs };

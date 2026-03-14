// src/queues/initQueues.js
const logger = require('../utils/logger');
const { setBullmqStatus } = require('../config/redis');

/**
 * Inicializa los workers y colas de forma segura.
 * Si Redis no está disponible, los workers intentarán reconectar en background.
 */
async function initQueues() {
    try {
        logger.info('🚀 Iniciando infraestructura de BullMQ (Graceful Degradation Mode)...');
        
        // Importación progresiva de workers
        require('../workers/emailWorker');
        require('../workers/cronWorker');
        require('../workers/webhookWorker');
        require('../workers/afipWorker');

        const { initAlertJobs } = require('../modules/reportes/alertWorker');
        await initAlertJobs();

        setBullmqStatus('OK');
        logger.info('✅ BullMQ y Workers inicializados correctamente.');
    } catch (error) {
        setBullmqStatus('DEGRADED');
        logger.error({ 
            err: error.message,
            stack: error.stack 
        }, '⚠️ Los Workers de BullMQ se iniciaron con advertencias (Modo Degradado).');
    }
}

module.exports = initQueues;

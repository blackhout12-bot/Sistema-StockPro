const eventBus = require('../eventBus');
const logger = require('../../utils/logger');

// Simulated DB model for audit or secondary action
const auditService = {
    logCreation: async (payload) => {
        logger.info({ payload }, '[AUDIT SUBSCRIBER] Producto creado registrado en log de auditoría asíncrono');
        // If there was an Audit DB, we would write to it here without blocking the HTTP request
    }
};

const setupSubscribers = async () => {
    try {
        await eventBus.subscribe(
            'audit.producto.creado', // Queue Name
            'producto.creado',       // Routing Key Pattern
            async (payload) => {
                await auditService.logCreation(payload);
            }
        );
        logger.info('Audit Subscriber attached to EventBus');
    } catch (error) {
        logger.error({ err: error }, 'Failed to setup Audit Subscribers');
    }
};

module.exports = setupSubscribers;

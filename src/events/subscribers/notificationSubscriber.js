const eventBus = require('../eventBus');
const logger = require('../../utils/logger');
const { notifyStockChange, getIO } = require('../../config/socket');

const setupNotificationSubscribers = async () => {
    try {
        await eventBus.subscribe(
            'notifications.stock_bajo', // Queue Name
            'STOCK_BAJO',               // Routing Key Pattern
            async (payload) => {
                logger.info({ payload }, '[NOTIFICATION SUBSCRIBER] Evento STOCK_BAJO recibido, emitiendo vía WebSocket');
                
                try {
                    const io = getIO();
                    // Emitir a los clientes conectados del tenant correspondiente
                    io.of(`/tenant-${payload.empresa_id}`).emit('notification:stock_bajo', {
                        title: 'Stock Crítico',
                        message: `El producto "${payload.nombre}" ha quedado con stock bajo (${payload.stock} unidades).`,
                        producto_id: payload.producto_id,
                        timestamp: new Date()
                    });
                } catch (e) {
                    logger.error({ err: e }, 'No se pudo emitir evento por WebSocket (posiblemente io no inicializado)');
                }
            }
        );
        logger.info('Notification Subscriber attached to EventBus');
    } catch (error) {
        logger.error({ err: error }, 'Failed to setup Notification Subscribers');
    }
};

module.exports = setupNotificationSubscribers;

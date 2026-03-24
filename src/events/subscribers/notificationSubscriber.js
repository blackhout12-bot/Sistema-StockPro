const eventBus = require('../eventBus');
const logger = require('../../utils/logger');
const { notifyStockChange, getIO } = require('../../config/socket');

const { connectDB } = require('../../config/db');
const notificacionRepo = require('../../repositories/notificacion.repository');

const setupNotificationSubscribers = async () => {
    try {
        await eventBus.subscribe(
            'notifications.stock_bajo', // Queue Name
            'STOCK_BAJO',               // Routing Key Pattern
            async (payload) => {
                logger.info({ payload }, '[NOTIFICATION SUBSCRIBER] Evento STOCK_BAJO recibido, persistiendo y emitiendo');
                
                try {
                    const pool = await connectDB();
                    // Al grabar, notificacion.repository emitirá 'NUEVA_NOTIFICACION' que el controlador interceptará para emitir vía WebSockets automáticamente.
                    await notificacionRepo.create(pool, {
                        empresa_id: payload.empresa_id,
                        titulo: 'Stock Crítico en Sucursal',
                        mensaje: `El producto "${payload.nombre}" ha superado el umbral con stock crítico de ${payload.stock} unidades.`,
                        tipo: 'warning'
                    });
                } catch (e) {
                    logger.error({ err: e }, 'No se pudo persistir notificación vinculada a STOCK_BAJO');
                }
            }
        );
        logger.info('Notification Subscriber attached to EventBus');
    } catch (error) {
        logger.error({ err: error }, 'Failed to setup Notification Subscribers');
    }
};

module.exports = setupNotificationSubscribers;

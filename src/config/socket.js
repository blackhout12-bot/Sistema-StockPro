// src/config/socket.js
const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*", // En producción restringir a FRONTEND_URL
            methods: ["GET", "POST"]
        }
    });

    // Namespace dinámico para Multi-tenancy
    const tenantNamespace = io.of(/^\/tenant-\d+$/);

    tenantNamespace.on('connection', (socket) => {
        const namespace = socket.nsp.name;
        const tenantId = namespace.split('-')[1];
        
        logger.info({ tenantId, socketId: socket.id }, 'Cliente conectado a namespace de tenant');

        socket.on('join-room', (room) => {
            socket.join(room);
            logger.debug({ socketId: socket.id, room }, 'Socket unido a sala');
        });

        socket.on('disconnect', () => {
            logger.info({ socketId: socket.id }, 'Cliente desconectado');
        });
    });

    logger.info('🚀 Socket.io inicializado con soporte multi-tenant');
    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.io no ha sido inicializado');
    return io;
}

/**
 * Notifica a todos los clientes de un tenant sobre un cambio de stock.
 */
function notifyStockChange(tenantId, productId, newStock) {
    if (!io) return;
    io.of(`/tenant-${tenantId}`).to(`product-${productId}`).emit('stock-update', {
        productId,
        newStock,
        timestamp: new Date()
    });
}

module.exports = { initSocket, getIO, notifyStockChange };

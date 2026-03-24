// src/config/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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

    // [Seguridad]: Interceptar y validar token JWT por cada handshake
    tenantNamespace.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            logger.warn({ socketId: socket.id }, 'Intento de conexión a Socket.io sin token');
            return next(new Error('Authentication error'));
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            socket.user = decoded;
            
            // Validar que el usuario pertenezca al tenant que quiere suscribirse
            const requestedTenant = socket.nsp.name.split('-')[1];
            if (String(decoded.empresa_id) !== String(requestedTenant)) {
                logger.warn({ user: decoded.id, requestedTenant }, 'Usuario no autorizado para este tenant socket');
                return next(new Error('Unauthorized tenant access'));
            }
            
            next();
        } catch (err) {
            logger.error({ err: err.message }, 'Fallo de autenticación en Socket.io JWT');
            return next(new Error('Authentication error'));
        }
    });

    tenantNamespace.on('connection', (socket) => {
        const namespace = socket.nsp.name;
        const tenantId = namespace.split('-')[1];
        
        logger.info({ tenantId, userId: socket.user?.id, socketId: socket.id }, 'Cliente legítimo conectado a namespace de tenant');

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

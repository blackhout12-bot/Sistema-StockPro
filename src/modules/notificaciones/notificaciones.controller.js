const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const notificacionRepository = require('../../repositories/notificacion.repository');
const { connectDB } = require('../../config/db');
const eventBus = require('../../events/eventBus');

const { getIO } = require('../../config/socket');

// Broadcast event to specific tenant via WebSockets
notificacionRepository.on('NUEVA_NOTIFICACION', (notificacion) => {
    try {
        const io = getIO();
        const tenantStr = `/tenant-${notificacion.empresa_id}`;
        
        // Broadcast a todos los conectatos al tenant
        // El cliente frontend debe ignorar las que tienen usuario_id y no coinciden con él,
        // o podemos disparar también a salas de usuario si quisiéramos. Por ahora la filtramos en Front
        io.of(tenantStr).emit('nueva-notificacion', notificacion);
    } catch (err) {
        // En caso que no esté inicializado el Socket.io aún
    }
});


// Listar notificaciones
router.get('/', async (req, res, next) => {
    try {
        const pool = await connectDB();
        const alerts = await notificacionRepository.getByUsuario(pool, req.user.id, req.tenant_id);
        res.json(alerts);
    } catch (err) {
        next(err);
    }
});

// Marcar una como leída
router.put('/:id/read', async (req, res, next) => {
    try {
        const pool = await connectDB();
        await notificacionRepository.markAsRead(pool, req.params.id, req.user.id, req.tenant_id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// Marcar todas como leídas
router.put('/read-all', async (req, res, next) => {
    try {
        const pool = await connectDB();
        await notificacionRepository.markAllAsRead(pool, req.user.id, req.tenant_id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

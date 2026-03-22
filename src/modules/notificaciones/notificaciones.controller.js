const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const notificacionRepository = require('../../repositories/notificacion.repository');
const { connectDB } = require('../../config/db');
const eventBus = require('../../events/eventBus');

// ── SSE Clients Registry ──
const sseClients = new Map();

// ── GET /notificaciones/stream ──
router.get('/stream', authenticate, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = `${req.tenant_id}_${req.user.id}_${Date.now()}`;
    
    // Send immediate initial ping
    res.write(`data: {"type": "ping"}\n\n`);

    sseClients.set(clientId, { res, empresa_id: req.tenant_id, usuario_id: req.user.id });

    // Keep alive to prevent proxies from closing
    const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
        clearInterval(keepAlive);
        sseClients.delete(clientId);
    });
});

// Broadcast event to specific tenant/user
notificacionRepository.on('NUEVA_NOTIFICACION', (notificacion) => {
    sseClients.forEach((client, id) => {
        if (client.empresa_id === notificacion.empresa_id) {
            // Si la notificacion es para un usuario específico, validar. Si no, a toda la empresa.
            if (!notificacion.usuario_id || client.usuario_id === notificacion.usuario_id) {
                client.res.write(`data: ${JSON.stringify(notificacion)}\n\n`);
            }
        }
    });
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

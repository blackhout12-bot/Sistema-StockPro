const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const notificacionRepository = require('../../repositories/notificacion.repository');
const { connectDB } = require('../../config/db');

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

// src/routes/public.routes.js
const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middlewares/verifyApiKey');
const publicController = require('../modules/public/public.controller');
const rateLimit = require('express-rate-limit');

// Rate limiting específico para la API pública basado en la API Key
const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite por defecto (se podría hacer dinámico por plan)
    keyGenerator: (req) => req.headers['x-api-key'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous',
    message: { error: 'Límite de peticiones a la API Pública excedido. Por favor intente más tarde.' }
});

router.use(verifyApiKey);
router.use(publicApiLimiter);

/**
 * @swagger
 * /api/public/inventory:
 *   get:
 *     summary: Obtener el catálogo de productos
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/inventory', publicController.getInventory);

/**
 * @swagger
 * /api/public/inventory/{id}/stock:
 *   get:
 *     summary: Obtener el stock de un producto específico
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/inventory/:id/stock', publicController.getProductStock);

module.exports = router;

const express = require('express');
const router = express.Router();
const withHealth = require('../../middlewares/health.middleware');

// Health Check por Módulo
router.use(withHealth('Monedas'));
const monedaService = require('./monedas.service');
const authenticate = require('../../middlewares/auth');

router.get('/', authenticate, async (req, res, next) => {
    try {
        const monedas = await monedaService.getAllMonedas();
        res.json(monedas);
    } catch (error) {
        next(error);
    }
});

// GET /monedas/cotizaciones - Obtener cotizaciones en tiempo real
router.get('/cotizaciones', authenticate, async (req, res, next) => {
    try {
        const rates = await monedaService.getLiveRates();
        res.json(rates);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

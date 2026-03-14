// src/modules/payments/payments.controller.js
const express = require('express');
const router = express.Router();
const paymentService = require('./payments.service');
const authenticate = require('../../middlewares/auth');
const logger = require('../../utils/logger');

// Iniciar un pago
router.post('/init', authenticate, async (req, res) => {
    const { monto, moneda, metodo } = req.body;
    try {
        const result = await paymentService.initPayment({
            monto,
            moneda,
            metodo,
            usuario_id: req.user.id,
            empresa_id: req.user.empresa_id
        });
        res.json(result);
    } catch (err) {
        logger.error({ error: err.message }, 'Error iniciando pago');
        res.status(500).json({ error: err.message });
    }
});

// Webhook Stripe
router.get('/recent', authenticate, async (req, res) => {
    try {
        const payments = await paymentService.getRecentPayments(req.user.empresa_id);
        const stats = await paymentService.getPaymentStats(req.user.empresa_id);
        res.json({ payments, stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/callback/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
        await paymentService.handleWebhookStripe(sig, req.body);
        res.json({ received: true });
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Webhook MercadoPago
router.post('/callback/mercadopago', async (req, res) => {
    try {
        await paymentService.handleWebhookMP(req.query);
        res.json({ received: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

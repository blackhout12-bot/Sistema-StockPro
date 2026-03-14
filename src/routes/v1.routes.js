// src/routes/v1.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');
const rateLimit = require('express-rate-limit');

// Limiter para Auth (Desactivado para Debug)
const authLimiter = (req, res, next) => next();

// --- Definición de Rutas V1 ---
router.get('/ping', (req, res) => res.json({ message: 'pong', version: 'v1' }));

// Públicas (Auth)
router.use('/auth', authLimiter, require('../modules/auth/auth.controller'));
router.use('/auth/sso', authLimiter, require('../modules/auth/auth_sso.controller'));

// Protegidas (Requieren Auth y Tenant Context)
router.use('/notificaciones', authenticate, tenantContext, require('../modules/notificaciones/notificaciones.controller'));
router.use('/reportes', authenticate, tenantContext, require('../modules/reportes/reportes.controller'));
router.use('/productos', authenticate, tenantContext, require('../modules/productos/productos.controller'));
router.use('/movimientos', authenticate, tenantContext, require('../modules/movimientos/movimientos.controller'));
router.use('/empresa', authenticate, tenantContext, require('../modules/empresa/empresa.controller'));
router.use('/clientes', authenticate, tenantContext, require('../modules/clientes/clientes.controller'));
router.use('/facturacion', authenticate, tenantContext, require('../modules/facturacion/facturacion.controller'));
router.use('/payments', authenticate, require('../modules/payments/payments.controller'));
router.use('/importacion', authenticate, tenantContext, require('../modules/importacion/importacion.controller'));
router.use('/monedas', authenticate, require('../modules/configuracion/monedas.controller'));

module.exports = router;

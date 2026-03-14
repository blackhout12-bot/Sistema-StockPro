// src/routes/v2.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');

// --- Definición de Rutas V2 ---
// V2 se enfoca en estandarización de respuestas y Webhooks

// Webhooks (Configuración de integraciones externas)
router.use('/webhooks', authenticate, tenantContext, require('../modules/notificaciones/webhooks.v2.controller'));

// En el futuro, aquí migraremos versiones más limpias de /productos, /facturacion, etc.

module.exports = router;

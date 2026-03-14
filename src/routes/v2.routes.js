// src/routes/v2.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');

// --- Definición de Rutas V2 ---

// 1. Marketplace
const marketplaceController = require('../modules/marketplace/marketplace.controller');
router.get('/marketplace', authenticate, tenantContext, marketplaceController.getModules);
router.post('/marketplace/install', authenticate, tenantContext, marketplaceController.installModule);

// 2. Ventas Externas (Integraciones multi-canal con Rate Limiting y API Key/JWT)
const externalSalesController = require('../modules/externalSales/externalSales.controller');
router.post('/ventas-externas/import', authenticate, tenantContext, externalSalesController.importSales);
router.get('/ventas-externas/export', authenticate, tenantContext, externalSalesController.exportSales);

// 3. Webhooks Seguros (HMAC Integrations o Webhooks genéricos)
const webhookController = require('../modules/externalAuth/webhook.controller');
// Usamos verifyApiKey o authenticate según convenga. Para webhooks de sistemas terceros suele usarse un secreto compartido
// Agregamos middleware de tenant basado en la URL u otros headers
router.post('/webhooks/secure/:tenant_id', (req, res, next) => {
    req.tenant_id = req.params.tenant_id;
    next();
}, webhookController.handleWebhook);

// Webhooks legacy (Configuración de integraciones externas)
router.use('/webhooks', authenticate, tenantContext, require('../modules/notificaciones/webhooks.v2.controller'));

module.exports = router;

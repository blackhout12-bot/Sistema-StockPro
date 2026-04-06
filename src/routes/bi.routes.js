const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');
const checkPermiso = require('../middlewares/rbac');
const cacheMiddleware = require('../middlewares/cache.middleware');
const biController = require('../modules/bi/bi.controller');
const withHealth = require('../middlewares/health.middleware');

// Health Check por Módulo
router.use(withHealth('Dashboard'));

// GET /api/v1/bi/financial-kpis
router.get('/financial-kpis', authenticate, tenantContext, checkPermiso('dashboard', 'leer'), cacheMiddleware(300), biController.exportFinancialKPIs.bind(biController));

// GET /api/v1/bi/operational-kpis
router.get('/operational-kpis', authenticate, tenantContext, checkPermiso('dashboard', 'leer'), cacheMiddleware(300), biController.exportOperationalKPIs.bind(biController));

module.exports = router;

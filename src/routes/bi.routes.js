const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');
const checkPermiso = require('../middlewares/rbac');
const biController = require('../modules/bi/bi.controller');

// GET /api/v1/bi/financial-kpis
router.get('/financial-kpis', authenticate, tenantContext, checkPermiso('dashboard', 'leer'), biController.exportFinancialKPIs.bind(biController));

// GET /api/v1/bi/operational-kpis
router.get('/operational-kpis', authenticate, tenantContext, checkPermiso('dashboard', 'leer'), biController.exportOperationalKPIs.bind(biController));

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const tenantContext = require('../middlewares/tenantContext');
const checkPermiso = require('../middlewares/rbac');
const olapController = require('../modules/olap/olap.controller');

// GET /api/v1/olap/cubo-ventas
router.get('/cubo-ventas', authenticate, tenantContext, checkPermiso('dashboard', 'leer'), olapController.getSalesCube.bind(olapController));

module.exports = router;

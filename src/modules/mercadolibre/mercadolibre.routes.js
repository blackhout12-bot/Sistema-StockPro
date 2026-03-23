const express = require('express');
const router = express.Router();
const mercadolibreController = require('./mercadolibre.controller');
const checkPermiso = require('../../middlewares/rbac');

// Funciones protegidas (Requieren Auth JWT porque se disparan desde el Frontend del ERP)
router.get('/auth', checkPermiso('integraciones', 'crear'), mercadolibreController.getAuthUrl);

module.exports = router;

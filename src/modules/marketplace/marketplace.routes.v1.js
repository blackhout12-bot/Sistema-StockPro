const express = require('express');
const router = express.Router();
const marketplaceController = require('./marketplace.controller');

// Marketplace Endpoints
router.get('/', marketplaceController.getModules);
router.post('/install', marketplaceController.installModule);

module.exports = router;

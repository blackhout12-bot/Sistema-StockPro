// src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiController = require('../modules/ai/ai.controller');
const verifyToken = require('../middlewares/auth');
const verifyRole = require('../middlewares/roles');

// Asegurar que solo usuarios autenticados logreados puedan acceder, y de restrigir a roles gerenciales si se desea
router.use(verifyToken);
router.use(verifyRole(['admin', 'gerente']));

// Rutas de Inteligencia Artificial (Fase 11)
router.get('/predict/:id/demand', aiController.predictDemand);
router.get('/alerts/expirations', aiController.checkExpirations);

module.exports = router;

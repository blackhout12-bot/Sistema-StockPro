// src/modules/movimientos/movimientos.controller.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const movimientosService = require('./movimientos.service');
const transferenciasController = require('./transferencias.controller');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');
const { validateBody } = require('../../middlewares/validateRequest');
const { movimientoSchema } = require('../../schemas/movimiento.schema');

// Listar movimientos (cualquier usuario autenticado con permiso)
router.get('/', checkPermiso('movimientos', 'leer'), async (req, res, next) => {
  try {
    const movimientos = await movimientosService.listarMovimientos(req.tenant_id);
    res.json(movimientos);
  } catch (err) {
    next(err);
  }
});

// Listar movimientos recientes (Dashboard)
router.get('/recientes', checkPermiso('movimientos', 'leer'), async (req, res, next) => {
  try {
    const movimientos = await movimientosService.obtenerMovimientosRecientes(req.tenant_id);
    res.json(movimientos);
  } catch (err) {
    next(err);
  }
});
// Registrar nuevo movimiento
router.post('/registrar', checkPermiso('movimientos', 'crear'), validateBody(movimientoSchema), audit('crear', 'Movimiento'), async (req, res, next) => {
  try {
    const { tipo, cantidad, productoId, deposito_id, motivo, nro_comprobante, nro_lote, fecha_vto } = req.body;
    const cleanBody = { tipo, cantidad, productoId, deposito_id, motivo, nro_comprobante, nro_lote, fecha_vto };
    const movimiento = await movimientosService.agregarMovimiento(cleanBody, req.user.id, req.tenant_id);
    res.locals.insertedId = movimiento.id;
    res.status(201).json(movimiento);
  } catch (err) {
    next(err);
  }
});

// ── RUTAS DE TRANSFERENCIAS (Multi-Depósito) ──────────────────────────────────
router.post('/transferir', checkPermiso('movimientos', 'crear'), audit('crear', 'Transferencia'), transferenciasController.transferir);
router.get('/transferencias/historial', checkPermiso('movimientos', 'leer'), transferenciasController.historial);

// Sincronizar movimientos offline
router.post('/sync', authenticate, async (req, res) => {
    const { movimientos } = req.body;
    if (!Array.isArray(movimientos)) {
        return res.status(400).json({ error: 'Se requiere un array de movimientos' });
    }
    try {
        const result = await movimientosService.syncMovimientosOffline(movimientos, req.user.id, req.user.empresa_id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


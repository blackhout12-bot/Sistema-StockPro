const express = require('express');
const router = express.Router();
const cuentasPagarService = require('./cuentas_pagar.service');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');

// Get all cuentas
router.get('/', checkPermiso('finanzas', 'leer'), async (req, res, next) => {
    try {
        const cuentas = await cuentasPagarService.getAllCuentas(req.tenant_id);
        res.json(cuentas);
    } catch (error) {
        next(error);
    }
});

// Get single cuenta
router.get('/:id', checkPermiso('finanzas', 'leer'), async (req, res, next) => {
    try {
        const cuenta = await cuentasPagarService.getCuentaById(parseInt(req.params.id), req.tenant_id);
        res.json(cuenta);
    } catch (error) {
        next(error);
    }
});

// Registrar pago
router.post('/pagar', checkPermiso('finanzas', 'crear'), audit('crear', 'PagoProveedor'), async (req, res, next) => {
    try {
        const result = await cuentasPagarService.registrarPago(req.body, req.tenant_id);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

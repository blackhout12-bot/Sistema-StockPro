const express = require('express');
const router = express.Router();
const cuentasCobrarService = require('./cuentas_cobrar.service');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');

// Get all cuentas
router.get('/', checkPermiso('finanzas', 'leer'), async (req, res, next) => {
    try {
        const cuentas = await cuentasCobrarService.getAllCuentas(req.tenant_id);
        res.json(cuentas);
    } catch (error) {
        next(error);
    }
});

// Get single cuenta
router.get('/:id', checkPermiso('finanzas', 'leer'), async (req, res, next) => {
    try {
        const cuenta = await cuentasCobrarService.getCuentaById(parseInt(req.params.id), req.tenant_id);
        res.json(cuenta);
    } catch (error) {
        next(error);
    }
});

// Registrar cobro
router.post('/cobrar', checkPermiso('finanzas', 'crear'), audit('crear', 'CobroCliente'), async (req, res, next) => {
    try {
        const result = await cuentasCobrarService.registrarCobro(req.body, req.tenant_id);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

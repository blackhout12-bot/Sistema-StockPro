const express = require('express');
const router = express.Router();
const comprasService = require('./compras.service');
const authenticate = require('../../middlewares/auth');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');

// Get all compras
router.get('/', checkPermiso('compras', 'leer'), async (req, res, next) => {
    try {
        const compras = await comprasService.getAllCompras(req.tenant_id);
        res.json(compras);
    } catch (error) {
        next(error);
    }
});

// Get single compra
router.get('/:id', checkPermiso('compras', 'leer'), async (req, res, next) => {
    try {
        const compra = await comprasService.getCompraById(parseInt(req.params.id), req.tenant_id);
        res.json(compra);
    } catch (error) {
        next(error);
    }
});

// Create compra
router.post('/', checkPermiso('compras', 'crear'), audit('crear', 'Compra'), async (req, res, next) => {
    try {
        const newCompra = await comprasService.createCompra(req.body, req.user.id, req.tenant_id);
        res.locals.insertedId = newCompra.id;
        res.status(201).json(newCompra);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

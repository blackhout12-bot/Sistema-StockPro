const express = require('express');
const router = express.Router();
const proveedoresService = require('./proveedores.service');
const authenticate = require('../../middlewares/auth');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');

// Get all proveedores
router.get('/', checkPermiso('proveedores', 'leer'), async (req, res, next) => {
    try {
        const proveedores = await proveedoresService.getAllProveedores(req.tenant_id);
        res.json(proveedores);
    } catch (error) {
        next(error);
    }
});

// Get single proveedor
router.get('/:id', checkPermiso('proveedores', 'leer'), async (req, res, next) => {
    try {
        const proveedor = await proveedoresService.getProveedorById(parseInt(req.params.id), req.tenant_id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(proveedor);
    } catch (error) {
        next(error);
    }
});

// Create proveedor
router.post('/', checkPermiso('proveedores', 'crear'), audit('crear', 'Proveedor'), async (req, res, next) => {
    try {
        const newProveedor = await proveedoresService.createProveedor(req.body, req.tenant_id);
        res.locals.insertedId = newProveedor.id;
        res.status(201).json(newProveedor);
    } catch (error) {
        next(error);
    }
});

// Update proveedor
router.put('/:id', checkPermiso('proveedores', 'actualizar'), audit('actualizar', 'Proveedor'), async (req, res, next) => {
    try {
        const updated = await proveedoresService.updateProveedor(parseInt(req.params.id), req.body, req.tenant_id);
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// Delete proveedor
router.delete('/:id', checkPermiso('proveedores', 'eliminar'), audit('eliminar', 'Proveedor'), async (req, res, next) => {
    try {
        await proveedoresService.deleteProveedor(parseInt(req.params.id), req.tenant_id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;

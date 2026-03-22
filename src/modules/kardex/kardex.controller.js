const express = require('express');
const router = express.Router();
const kardexService = require('./kardex.service');
const checkPermiso = require('../../middlewares/rbac');

// Get kardex by producto
router.get('/producto/:id', checkPermiso('reportes', 'leer'), async (req, res, next) => {
    try {
        const kardex = await kardexService.getKardexByProducto(parseInt(req.params.id), req.tenant_id);
        res.json(kardex);
    } catch (error) {
        next(error);
    }
});

// Get inventario valorizado global
router.get('/valorizado', checkPermiso('reportes', 'leer'), async (req, res, next) => {
    try {
        const valorizado = await kardexService.getInventarioValorizado(req.tenant_id);
        res.json(valorizado);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

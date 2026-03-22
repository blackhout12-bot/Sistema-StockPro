const express = require('express');
const router = express.Router();
const sucursalesModel = require('./sucursales.model');
const { checkPermiso } = require('../../middlewares/auth');

router.get('/', async (req, res) => {
    try {
        const data = await sucursalesModel.getAll(req.empresa_id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', checkPermiso('configuracion', 'crear'), async (req, res) => {
    try {
        const data = await sucursalesModel.create(req.empresa_id, req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', checkPermiso('configuracion', 'actualizar'), async (req, res) => {
    try {
        const updated = await sucursalesModel.update(req.params.id, req.empresa_id, req.body);
        if (!updated) return res.status(404).json({ message: 'Sucursal no encontrada' });
        res.json({ message: 'Modificada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', checkPermiso('configuracion', 'eliminar'), async (req, res) => {
    try {
        const deleted = await sucursalesModel.delete(req.params.id, req.empresa_id);
        if (!deleted) return res.status(404).json({ message: 'Sucursal no encontrada o en uso' });
        res.json({ message: 'Eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando. Verifique que no tenga dependencias estrictas.' });
    }
});

module.exports = router;

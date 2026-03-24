const express = require('express');
const router = express.Router();
const categoriasService = require('./categorias.service');
const checkPermiso = require('../../middlewares/rbac');
const logger = require('../../utils/logger');

// POST /api/v1/categorias
router.post('/', checkPermiso('productos', 'crear'), async (req, res, next) => {
    try {
        const { nombre, descripcion, sucursal_id, deposito_id, activo } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio.' });
        }
        const cat = await categoriasService.createCategoria({
            nombre, descripcion, sucursal_id, deposito_id, activo
        }, req.tenant_id);
        
        res.status(201).json(cat);
    } catch (error) {
        if (error.message.includes('Ya existe')) {
            return res.status(400).json({ error: error.message });
        }
        logger.error({ err: error, body: req.body }, '[POST /categorias] Error');
        next(error);
    }
});

// GET /api/v1/categorias
router.get('/', checkPermiso('productos', 'leer'), async (req, res, next) => {
    try {
        const filtros = {
            sucursal_id: req.query.sucursal_id,
            buscar: req.query.buscar,
            activo: req.query.activo
        };
        const items = await categoriasService.getCategorias(req.tenant_id, filtros);
        res.json(items);
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/categorias/:id
router.get('/:id', checkPermiso('productos', 'leer'), async (req, res, next) => {
    try {
        const cat = await categoriasService.getCategoriaById(parseInt(req.params.id), req.tenant_id);
        res.json(cat);
    } catch (error) {
        if (error.message === 'Categoría no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
});

// PUT /api/v1/categorias/:id
router.put('/:id', checkPermiso('productos', 'editar'), async (req, res, next) => {
    try {
        const cat = await categoriasService.updateCategoria(parseInt(req.params.id), req.body, req.tenant_id);
        res.json(cat);
    } catch (error) {
        if (error.message.includes('Ya existe')) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Categoría no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        logger.error({ err: error, params: req.params, body: req.body }, '[PUT /categorias/:id] Error');
        next(error);
    }
});

// DELETE /api/v1/categorias/:id
router.delete('/:id', checkPermiso('productos', 'eliminar'), async (req, res, next) => {
    try {
        const result = await categoriasService.deleteCategoria(parseInt(req.params.id), req.tenant_id);
        res.json(result);
    } catch (error) {
        if (error.message.includes('hay productos asociados')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message === 'Categoría no encontrada') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
});

module.exports = router;

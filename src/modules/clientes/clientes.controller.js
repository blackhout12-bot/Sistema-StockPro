const express = require('express');
const router = express.Router();
const clienteService = require('./clientes.service');
const authenticate = require('../../middlewares/auth');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');
const { validateBody } = require('../../middlewares/validateRequest');
const { clienteSchema } = require('../../schemas/cliente.schema');

// Get all clientes
router.get('/', checkPermiso('clientes', 'leer'), async (req, res, next) => {
    try {
        const clientes = await clienteService.getAllClientes(req.tenant_id);
        res.json(clientes);
    } catch (error) {
        next(error);
    }
});

// Get single cliente
router.get('/:id', checkPermiso('clientes', 'leer'), async (req, res, next) => {
    try {
        const cliente = await clienteService.getClienteById(parseInt(req.params.id), req.tenant_id);
        if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(cliente);
    } catch (error) {
        next(error);
    }
});

// Create cliente
router.post('/', checkPermiso('clientes', 'crear'), validateBody(clienteSchema), audit('crear', 'Cliente'), async (req, res, next) => {
    try {
        const newCliente = await clienteService.createCliente(req.body, req.tenant_id);
        res.locals.insertedId = newCliente.id;
        res.status(201).json(newCliente);
    } catch (error) {
        next(error);
    }
});

// Update cliente
router.put('/:id', checkPermiso('clientes', 'actualizar'), validateBody(clienteSchema), audit('actualizar', 'Cliente'), async (req, res, next) => {
    try {
        const updated = await clienteService.updateCliente(parseInt(req.params.id), req.body, req.tenant_id);
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// Delete cliente (Solo Admin via RBAC)
router.delete('/:id', checkPermiso('clientes', 'eliminar'), audit('eliminar', 'Cliente'), async (req, res, next) => {
    try {
        await clienteService.deleteCliente(parseInt(req.params.id), req.tenant_id);
        res.status(204).send();
    } catch (error) {
        if (error.message.includes('facturas asociadas')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
});

module.exports = router;

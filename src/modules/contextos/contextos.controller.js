const express = require('express');
const router = express.Router();
const contextosModel = require('./contextos.model');
const audit = require('../../middlewares/audit');

// Obtener los contextos a los que este operador en particular tiene acceso
router.get('/mis-contextos', async (req, res) => {
    try {
        const accesos = await contextosModel.getByUserId(req.user.id);
        res.json(accesos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Administrador buscando todo el pool de contextos de la franquicia
router.get('/', async (req, res) => {
    try {
        const data = await contextosModel.getAll(req.tenant_id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint Transaccional para Forzar Switch de Contexto Activo
// Se inyecta la directiva genérica de auditoría nativa
router.put('/switch/:id', audit('cambiar_contexto', 'Contextos'), async (req, res) => {
    try {
        const contextoDestino = await contextosModel.updateActiveContext(req.user.id, req.params.id);
        res.status(200).json({ 
            message: 'Contexto conmutado exitosamente', 
            sucursal_activa: contextoDestino.sucursal_id,
            nuevo_rol_heredado: contextoDestino.rol_local
        });
    } catch (error) {
        req.log.warn({ err: error.message, userId: req.user.id }, 'Violacion de RBAC detectada en switch de contexto');
        res.status(403).json({ message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');
const posService = require('./pos.service');
const { validateBody } = require('../../middlewares/validateRequest');
const { abrirSesionSchema, cerrarSesionSchema } = require('../../schemas/pos.schema');

router.get('/cajas', checkPermiso('facturacion', 'leer'), async (req, res, next) => {
    try {
        const cajas = await posService.getCajas(req.tenant_id);
        res.json(cajas);
    } catch (err) { next(err); }
});

router.get('/sesion/activa', checkPermiso('facturacion', 'leer'), async (req, res, next) => {
    try {
        const { caja_id } = req.query;
        const sesion = await posService.getSesionActiva(caja_id || null, req.user.id);
        res.json(sesion || null);
    } catch (err) { next(err); }
});

router.post('/sesion/abrir', checkPermiso('facturacion', 'crear'), validateBody(abrirSesionSchema), audit('crear', 'POS_Sesion'), async (req, res, next) => {
    try {
        const { caja_id, monto_inicial } = req.body;
        const sesion = await posService.abrirSesion(caja_id, req.user.id, monto_inicial);
        res.json(sesion);
    } catch (err) { next(err); }
});

router.post('/sesion/cerrar', checkPermiso('facturacion', 'actualizar'), validateBody(cerrarSesionSchema), audit('actualizar', 'POS_Sesion'), async (req, res, next) => {
    try {
        const { sesion_id, monto_cierre } = req.body;
        const sesion = await posService.cerrarSesion(sesion_id, req.user.id, monto_cierre);
        res.json(sesion);
    } catch (err) { next(err); }
});

module.exports = router;

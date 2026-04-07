// src/modules/roles/roles.controller.js
const express = require('express');
const router = express.Router();
const checkPermiso = require('../../middlewares/rbac');
const { validateBody } = require('../../middlewares/validateRequest');
const audit = require('../../middlewares/audit');
const { rolSchema } = require('../../schemas/rol.schema');

const { obtenerPlanEmpresa } = require('../../repositories/auth.repository');

router.post('/create', checkPermiso('empresa', 'crear'), validateBody(rolSchema), audit('crear', 'Rol'), async (req, res, next) => {
    try {
        const { nombre, codigo_rol, permisos } = req.body;
        
        // 1. Validar permisos contra el Plan (v1.28.1-fixed)
        const plan = await obtenerPlanEmpresa(req.tenant_id);
        if (plan && plan.modulos && !plan.modulos['*']) {
            const modulosSolicitados = Object.keys(permisos).filter(k => k !== '*');
            const modulosNoPermitidos = modulosSolicitados.filter(m => !plan.modulos[m]);
            
            if (modulosNoPermitidos.length > 0) {
                return res.status(403).json({
                    error: `No puede asignar permisos para los módulos: [${modulosNoPermitidos.join(', ')}]. Estos no están incluidos en su plan (${plan.nombre}).`
                });
            }
        }

        const pool = await require('../../config/db').connectDB();
        const result = await pool.request()
            .input('empresa_id', req.tenant_id)
            .input('nombre', nombre)
            .input('codigo_rol', codigo_rol)
            .input('permisos', JSON.stringify(permisos || {}))
            .query(`
                INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos)
                VALUES (@empresa_id, @nombre, @codigo_rol, @permisos);
                SELECT * FROM Roles WHERE id = SCOPE_IDENTITY();
            `);
        res.status(201).json(result.recordset[0]);
    } catch (err) { next(err); }
});

module.exports = router;

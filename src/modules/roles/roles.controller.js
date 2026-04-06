// src/modules/roles/roles.controller.js
const express = require('express');
const router = express.Router();
const checkPermiso = require('../../middlewares/rbac');
const { validateBody } = require('../../middlewares/validateRequest');
const audit = require('../../middlewares/audit');
const { rolSchema } = require('../../schemas/rol.schema');

router.post('/create', checkPermiso('empresa', 'crear'), validateBody(rolSchema), audit('crear', 'Rol'), async (req, res, next) => {
    try {
        const { nombre, codigo_rol, permisos } = req.body;
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

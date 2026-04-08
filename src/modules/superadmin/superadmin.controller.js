// src/modules/superadmin/superadmin.controller.js
// Rutas exclusivas del SuperAdministrador global (v1.28.2)
const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../../config/db');
const { deleteCache } = require('../../config/redis');

/**
 * Middleware de guardia para superadmin.
 * Asegura que solo el rol 'superadmin' acceda a estas rutas.
 */
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.rol !== 'superadmin') {
        return res.status(403).json({
            error: 'Acceso restringido. Solo el SuperAdministrador puede acceder a este recurso.'
        });
    }
    next();
}

// Aplicar guardia a todas las rutas del módulo
router.use(requireSuperAdmin);

// ── POST /superadmin/changePlan — Cambio de plan con sincronización inmediata ─────
router.post('/changePlan', async (req, res, next) => {
    try {
        const { empresaId, nuevoPlanId } = req.body;

        if (!empresaId || !nuevoPlanId) {
            return res.status(400).json({ error: 'empresaId y nuevoPlanId son requeridos.' });
        }

        const pool = await connectDB();

        // 1. Verificar existencia de plan y obtener sus módulos
        const planRes = await pool.request()
            .input('pid', sql.Int, nuevoPlanId)
            .query(`SELECT id, nombre, modulos_json FROM Planes WHERE id = @pid`);

        if (!planRes.recordset[0]) {
            return res.status(404).json({ error: 'El plan especificado no existe.' });
        }

        const plan = planRes.recordset[0];
        let modulos = {};
        try { modulos = JSON.parse(plan.modulos_json); } catch {}

        // 2. Actualizar plan en la tabla Empresa
        await pool.request()
            .input('eid', sql.Int, empresaId)
            .input('pid', sql.Int, nuevoPlanId)
            .query(`UPDATE Empresa SET plan_id = @pid WHERE id = @eid`);

        // 3. Invalidar cache para que el próximo request del tenant tome el nuevo plan
        await deleteCache(`empresa:${empresaId}`);
        await deleteCache(`empresa:plan:${empresaId}`);

        // 4. Retornar módulos habilitados como objeto para el frontend
        res.json({
            empresaId: parseInt(empresaId),
            planId: parseInt(nuevoPlanId),
            planNombre: plan.nombre,
            feature_toggles: modulos
        });
    } catch (err) {
        next(err);
    }
});



// ── GET /superadmin/empresas — Listado completo de empresas + plan ────────────
router.get('/empresas', async (req, res, next) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                e.id, e.nombre, e.documento_identidad, e.email, e.pais,
                e.plan_id,
                p.nombre AS plan_nombre,
                p.modulos_json AS plan_modulos,
                (SELECT COUNT(*) FROM Usuarios u WHERE u.empresa_id = e.id AND u.rol != 'superadmin') AS total_usuarios,
                (SELECT COUNT(*) FROM Facturas f WHERE f.empresa_id = e.id) AS total_facturas
            FROM Empresa e
            LEFT JOIN Planes p ON e.plan_id = p.id
            ORDER BY e.id DESC
        `);

        const empresas = result.recordset.map(e => {
            let modulos = {};
            try { modulos = JSON.parse(e.plan_modulos); } catch {}
            return { ...e, plan_modulos: modulos };
        });

        res.json(empresas);
    } catch (err) {
        next(err);
    }
});

// ── GET /superadmin/planes — Lista de todos los planes disponibles ────────────
router.get('/planes', async (req, res, next) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(
            `SELECT id, nombre, descripcion, modulos_json FROM Planes ORDER BY id`
        );
        const planes = result.recordset.map(p => {
            let modulos = {};
            try { modulos = JSON.parse(p.modulos_json); } catch {}
            return { ...p, modulos };
        });
        res.json(planes);
    } catch (err) {
        next(err);
    }
});

// ── PUT /superadmin/empresas/:id/plan — Reasignar plan a una empresa ──────────
router.put('/empresas/:id/plan', async (req, res, next) => {
    try {
        const { plan_id } = req.body;
        const empresa_id = parseInt(req.params.id);

        if (!plan_id || isNaN(empresa_id)) {
            return res.status(400).json({ error: 'empresa_id y plan_id son requeridos.' });
        }

        const pool = await connectDB();

        // Verificar que el plan existe
        const planCheck = await pool.request()
            .input('pid', sql.Int, plan_id)
            .query(`SELECT id, nombre FROM Planes WHERE id = @pid`);

        if (!planCheck.recordset[0]) {
            return res.status(404).json({ error: 'Plan no encontrado.' });
        }

        // Actualizar plan de la empresa
        await pool.request()
            .input('eid', sql.Int, empresa_id)
            .input('pid', sql.Int, plan_id)
            .query(`UPDATE Empresa SET plan_id = @pid WHERE id = @eid`);

        // Invalidar caché
        await deleteCache(`empresa:${empresa_id}`);
        await deleteCache(`empresa:plan:${empresa_id}`);

        res.json({
            message: `Plan actualizado correctamente`,
            empresa_id,
            plan_id,
            plan_nombre: planCheck.recordset[0].nombre
        });
    } catch (err) {
        next(err);
    }
});


// ── GET /superadmin/stats — Estadísticas globales de la plataforma ────────────
router.get('/stats', async (req, res, next) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Empresa) AS total_empresas,
                (SELECT COUNT(*) FROM Usuarios WHERE rol != 'superadmin') AS total_usuarios,
                (SELECT COUNT(*) FROM Facturas) AS total_facturas,
                (SELECT COUNT(*) FROM Productos) AS total_productos,
                (SELECT COUNT(*) FROM Planes) AS total_planes,
                (SELECT COUNT(*) FROM Empresa WHERE plan_id = 5) AS empresas_enterprise,
                (SELECT COUNT(*) FROM Empresa WHERE plan_id IS NULL OR plan_id = 0) AS empresas_sin_plan
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

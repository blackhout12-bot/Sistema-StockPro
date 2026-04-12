const express = require('express');
const router = express.Router();
const authRepository = require('../../repositories/auth.repository');
const auditRepository = require('../../repositories/audit.repository');
const { deleteCache } = require('../../config/redis');

/**
 * SuperAdmin Controller
 * Restauración del panel global v1.28.2
 * Ampliación v1.28.7 - Administración Total
 */

// Middleware de seguridad local (Fuerza bypass solo para este rol)
router.use((req, res, next) => {
    if (req.user?.rol !== 'superadmin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado: Requieres privilegios de SuperAdmin.' });
    }
    next();
});

// GET /empresas - Listado global de empresas
router.get('/empresas', async (req, res, next) => {
    try {
        const empresas = await authRepository.obtenerTodasLasEmpresas();

        const enriched = await Promise.all(empresas.map(async e => {
            const planId = e.plan_id;
            if (!planId) return e;

            const planNombre = await authRepository.obtenerNombrePlan(planId);
            const planDescripcion = await authRepository.obtenerDescripcionPlan(planId);
            const featureToggles = await authRepository.generarFeatureToggles(planId);

            // Convertimos el JSON dictionary de featureToggles a un array amigable para SuperAdminUI si se requiere, pero lo exponemos en bruto:
            // Opcional: si la BD tiene `mod_facturacion: true`, iteramos:
            let modulos_activos = [];
            if (featureToggles && typeof featureToggles === 'object') {
                if (featureToggles['*']) {
                    modulos_activos = ['Acceso Total (*)'];
                } else {
                    modulos_activos = Object.keys(featureToggles).filter(k => featureToggles[k]);
                }
            }

            return {
                ...e,
                planId,
                planNombre,
                planDescripcion,
                feature_toggles: modulos_activos.length > 0 ? modulos_activos : Object.keys(featureToggles)
            };
        }));

        res.json(enriched);
    } catch (error) {
        next(error);
    }
});

// GET /stats - Métricas globales para el Dashboard (v1.29.2)
router.get('/stats', async (req, res) => {
    try {
        const stats = await authRepository.obtenerMetricasGlobales();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /usuarios - Listado global de usuarios (v1.28.9)
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await authRepository.obtenerUsuariosGlobal();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /changePlan - Cambio dinámico de plan y propagación (v1.28.2-apply)
router.post('/changePlan', async (req, res) => {
    try {
        const { empresaId, nuevoPlanId } = req.body;
        
        if (!empresaId || !nuevoPlanId) {
            return res.status(400).json({ error: 'Parámetros empresaId y nuevoPlanId son obligatorios.' });
        }

        await authRepository.actualizarPlanEmpresa(empresaId, nuevoPlanId);
        
        const toggles = await authRepository.generarFeatureToggles(nuevoPlanId);
        const planNombre = await authRepository.obtenerNombrePlan(nuevoPlanId);
        const planDescripcion = await authRepository.obtenerDescripcionPlan(nuevoPlanId);

        await auditRepository.logAction({
            usuario_id: req.user.id,
            accion: 'changePlan',
            entidad: 'Empresa',
            entidad_id: empresaId,
            payload: { nuevoPlanId, planNombre },
            ip: req.ip
        });

        let modulos_activos = [];
        if (toggles && typeof toggles === 'object') {
            if (toggles['*']) {
                modulos_activos = ['Acceso Total (*)'];
            } else {
                modulos_activos = Object.keys(toggles).filter(k => toggles[k]);
            }
        }

        return res.json({
            empresaId,
            planId: nuevoPlanId,
            planNombre,
            planDescripcion,
            feature_toggles: modulos_activos.length > 0 ? modulos_activos : Object.keys(toggles),
            _raw_toggles: toggles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// v1.28.7 - Administración Total

router.post('/deleteEmpresas', async (req, res) => {
    try {
        const { empresaIds } = req.body;
        if (!empresaIds || !Array.isArray(empresaIds) || empresaIds.length === 0) {
            return res.status(400).json({ error: 'No se enviaron IDs válidos' });
        }

        const backupId = await authRepository.backupEmpresas(empresaIds, req.user.email);
        await authRepository.eliminarEmpresas(empresaIds);
        
        await auditRepository.logAction({
            usuario_id: req.user.id,
            accion: 'deleteEmpresa',
            entidad: 'Empresa',
            entidad_id: null,
            payload: { empresaIds, backupId },
            ip: req.ip
        });

        res.json({ success: true, deleted: empresaIds, backupId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/deleteUsuarios', async (req, res) => {
    try {
        const { usuarioIds } = req.body;
        if (!usuarioIds || !Array.isArray(usuarioIds) || usuarioIds.length === 0) {
            return res.status(400).json({ error: 'No se enviaron IDs válidos' });
        }

        const backupId = await authRepository.backupUsuarios(usuarioIds, req.user.email);
        await authRepository.eliminarUsuarios(usuarioIds);
        
        await auditRepository.logAction({
            usuario_id: req.user.id,
            accion: 'deleteUsuario',
            entidad: 'Usuarios',
            entidad_id: null,
            payload: { usuarioIds, backupId },
            ip: req.ip
        });

        res.json({ success: true, deleted: usuarioIds, backupId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/backups', async (req, res) => {
    try {
        const backups = await authRepository.obtenerBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/rollback', async (req, res) => {
    try {
        const { backupId } = req.body;
        if (!backupId) return res.status(400).json({ error: 'BackupId requerido' });
        
        const tipo = await authRepository.restaurarBackup(backupId);
        
        await auditRepository.logAction({
            usuario_id: req.user.id,
            accion: `rollback${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
            entidad: tipo === 'empresa' ? 'Empresa' : 'Usuarios',
            entidad_id: null,
            payload: { backupId, msg: `Rollback aplicado al backup ${backupId} de tipo ${tipo}` },
            ip: req.ip
        });

        res.json({ success: true, restored: backupId, tipo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/auditoria/logs', async (req, res) => {
    try {
        const { tipo, fechaDesde, fechaHasta } = req.query;
        const logs = await authRepository.obtenerLogsAuditoria({ tipo, fechaDesde, fechaHasta });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const authRepository = require('../../repositories/auth.repository');
const { deleteCache } = require('../../config/redis');

/**
 * SuperAdmin Controller
 * Restauración del panel global v1.28.2
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

// POST /changePlan - Cambio dinámico de plan y propagación (v1.28.2-apply)
router.post('/changePlan', async (req, res) => {
    try {
        const { empresaId, nuevoPlanId } = req.body;
        
        if (!empresaId || !nuevoPlanId) {
            return res.status(400).json({ error: 'Parámetros empresaId y nuevoPlanId son obligatorios.' });
        }

        await authRepository.actualizarPlanEmpresa(empresaId, nuevoPlanId);

        // invalidar cache/session (Propagación inmediata)
        await deleteCache(`empresa:${empresaId}`);

        // regenerar toggles (Garantiza consulta directa en la próxima request)
        const toggles = await authRepository.generarFeatureToggles(nuevoPlanId);
        const planNombre = await authRepository.obtenerNombrePlan(nuevoPlanId);
        const planDescripcion = await authRepository.obtenerDescripcionPlan(nuevoPlanId);

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

module.exports = router;

const express = require('express');
const router = express.Router();
const searchService = require('./search.service');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');
const logger = require('../../utils/logger');

// GET /api/v1/search?q=...
router.get('/', checkPermiso('dashboard', 'leer'), audit('buscar', 'OmniSearch'), async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

        // Auditaríamos manualmente aquí también si audit() no dejara claro el texto buscado
        logger.info({ userId: req.user.id, empresa_id: req.tenant_id, query: q }, '[POST /search] Búsqueda Omni-Box intentada');

        const userRole = req.user.rol;
        const results = await searchService.performGlobalSearch(q, req.tenant_id, userRole);
        
        res.json(results);
    } catch (error) {
        logger.error({ userId: req.user.id, error: error.message }, 'Error en omni-search global');
        next(error);
    }
});

module.exports = router;

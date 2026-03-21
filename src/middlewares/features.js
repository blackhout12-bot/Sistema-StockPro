const { connectReadOnlyDB, sql } = require('../config/db');
const { getCache, setCache } = require('../config/redis');

/**
 * Middleware para Validar Feature Toggles / Módulos Extras
 * Verifica si el tenant tiene activa la funcionalidad solicitada.
 *
 * @param {string} moduloKey Ej: 'mod_lotes', 'mod_produccion', 'mod_fidelizacion'
 * @returns Express Middleware
 */
const requireFeature = (moduloKey) => {
    return async (req, res, next) => {
        try {
            const tenant_id = req.tenant_id;
            if (!tenant_id) {
                return res.status(401).json({ error: 'Falta contexto de Empresa (tenant_id).' });
            }

            const cacheKey = `features:tenant_${tenant_id}`;
            let toggles = {};

            // 1. Obtener desde Caché
            const cachedToggles = await getCache(cacheKey);
            
            if (cachedToggles) {
                toggles = typeof cachedToggles === 'string' ? JSON.parse(cachedToggles) : cachedToggles;
            } else {
                // 2. Si hay Cache Miss, buscar en DB
                const pool = await connectReadOnlyDB();
                const result = await pool.request()
                    .input('id', sql.Int, tenant_id)
                    .query('SELECT feature_toggles FROM Empresa WHERE id = @id');
                
                if (result.recordset.length > 0 && result.recordset[0].feature_toggles) {
                    try {
                        toggles = JSON.parse(result.recordset[0].feature_toggles);
                    } catch (e) { toggles = {}; }
                }

                // Guardar en redis por 30 minutos
                await setCache(cacheKey, toggles, 1800);
            }

            // 3. Evaluar
            if (!toggles[moduloKey]) {
                return res.status(403).json({ 
                    error: `El módulo o característica requerida (${moduloKey}) se encuentra inactiva para esta Empresa. Actívalo en Configuración -> Módulos Extras.` 
                });
            }

            next();
        } catch (error) {
            req.log.error({ error, moduloKey }, 'Error validando Feature Toggle');
            return res.status(500).json({ error: 'Error interno verificando disponibilidad del módulo.' });
        }
    };
};

module.exports = requireFeature;

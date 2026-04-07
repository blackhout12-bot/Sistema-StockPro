const { connectDB, connectReadOnlyDB } = require('../../config/db');
const empresaModel = require('./empresa.model');
const { getCache, setCache, deleteCache } = require('../../config/redis');
const logger = require('../../utils/logger');

class EmpresaService {

    async getEmpresa(empresa_id) {
        const pool = await connectDB();
        const empresa = await empresaModel.getEmpresa(pool, empresa_id);
        
        if (empresa) {
            // Fusionar Feature Toggles con el Plan (v1.28.1-fixed)
            let planModulos = {};
            try {
                planModulos = typeof empresa.plan_modulos === 'string' 
                    ? JSON.parse(empresa.plan_modulos) 
                    : (empresa.plan_modulos || {});
            } catch (e) {
                logger.error({ empresa_id, error: e.message }, 'Error parseando plan_modulos');
            }

            let currentToggles = {};
            try {
                currentToggles = typeof empresa.feature_toggles === 'string'
                    ? JSON.parse(empresa.feature_toggles)
                    : (empresa.feature_toggles || {});
            } catch (e) { }

            // Si es plan Enterprise (*), habilitamos todo lo que el sistema ofrece
            if (planModulos['*']) {
                // Mock de todos los módulos del sistema (se puede expandir)
                const allModules = ['facturacion', 'productos', 'categorias', 'movimientos', 'sucursales', 
                                    'proveedores', 'auditoria', 'usuarios', 'depositos', 'pos', 'kardex', 
                                    'produccion', 'calidad', 'ordenes_trabajo', 'contratos', 'agenda', 'tickets', 'sla'];
                allModules.forEach(m => currentToggles[m] = true);
            } else {
                // Filtrar toggles actuales — solo dejamos los que el plan permite
                const restrictedToggles = {};
                Object.keys(planModulos).forEach(m => {
                    if (planModulos[m]) restrictedToggles[m] = true;
                });
                
                // Módulos Core siempre activos en el frontend
                ['dashboard', 'notificaciones', 'perfil', 'configuracion', 'empresa'].forEach(m => restrictedToggles[m] = true);
                
                currentToggles = restrictedToggles;
            }

            empresa.feature_toggles = currentToggles;
        }

        return empresa;
    }

    async updateEmpresa(empresa_id, empresaData) {
        const pool = await connectDB();
        // Siempre forzar el id del tenant — no puede actualizar otra empresa
        empresaData.id = empresa_id;
        const res = await empresaModel.updateEmpresa(pool, empresaData);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateConfiguracion(empresa_id, config) {
        const pool = await connectDB();
        const res = await empresaModel.updateConfiguracion(pool, empresa_id, config);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateBranding(empresa_id, branding) {
        const pool = await connectDB();
        const res = await empresaModel.updateBranding(pool, empresa_id, branding);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateInventarioConfig(empresa_id, inv) {
        const pool = await connectDB();
        const res = await empresaModel.updateInventarioConfig(pool, empresa_id, inv);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateImpuestosConfig(empresa_id, imp) {
        const pool = await connectDB();
        const res = await empresaModel.updateImpuestosConfig(pool, empresa_id, imp);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateIntegracionesConfig(empresa_id, intConfig) {
        const pool = await connectDB();
        const res = await empresaModel.updateIntegracionesConfig(pool, empresa_id, intConfig);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateDashboardConfig(empresa_id, dash) {
        const pool = await connectDB();
        const res = await empresaModel.updateDashboardConfig(pool, empresa_id, dash);
        await deleteCache(`stats:tenant_${empresa_id}`);
        return res;
    }

    async updateFeatureToggles(empresa_id, toggles) {
        const pool = await connectDB();
        const res = await empresaModel.updateFeatureToggles(pool, empresa_id, toggles);
        const { deleteCache } = require('../../config/redis');
        await deleteCache(`stats:tenant_${empresa_id}`);
        await deleteCache(`features:tenant_${empresa_id}`); // Invalidate the requireFeature cache
        
        try {
            const { notifyEvent } = require('../../utils/webhook.service');
            await notifyEvent(empresa_id, 'modules.updated', {
                toggles,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('Error firing modules.updated webhook', e);
        }

        return res;
    }

    async getComprobantes(empresa_id) {
        const pool = await connectDB();
        return await empresaModel.getComprobantes(pool, empresa_id);
    }

    async updateComprobante(empresa_id, comp_id, data) {
        const pool = await connectDB();
        return await empresaModel.updateComprobante(pool, empresa_id, comp_id, data);
    }

    async createComprobante(empresa_id, data) {
        const pool = await connectDB();
        return await empresaModel.createComprobante(pool, empresa_id, data);
    }

    async getEstadisticas(empresa_id) {
        const cacheKey = `stats:tenant_${empresa_id}`;
        
        // 1. Intentar obtener de Caché (Redis)
        const cachedStats = await getCache(cacheKey);
        if (cachedStats) {
            logger.debug({ empresa_id }, 'Estadísticas servidas desde Caché (Redis)');
            return cachedStats;
        }

        // 2. Si no hay caché, calcular en Base de Datos
        logger.debug({ empresa_id }, 'Calculando Estadísticas en Base de Datos (Cache Miss)');
        const pool = await connectReadOnlyDB();
        const baseStats = await empresaModel.getEstadisticas(pool, empresa_id);
        
        // 3. Guardar en Caché por 5 minutos (300 segundos)
        await setCache(cacheKey, baseStats, 300);
        
        return baseStats;
    }
}

module.exports = new EmpresaService();

const { connectDB, connectReadOnlyDB } = require('../../config/db');
const empresaModel = require('./empresa.model');
const { getCache, setCache } = require('../../config/redis');
const logger = require('../../utils/logger');

class EmpresaService {

    async getEmpresa(empresa_id) {
        const pool = await connectDB();
        return await empresaModel.getEmpresa(pool, empresa_id);
    }

    async updateEmpresa(empresa_id, empresaData) {
        const pool = await connectDB();
        // Siempre forzar el id del tenant — no puede actualizar otra empresa
        empresaData.id = empresa_id;
        return await empresaModel.updateEmpresa(pool, empresaData);
    }

    async updateConfiguracion(empresa_id, config) {
        const pool = await connectDB();
        return await empresaModel.updateConfiguracion(pool, empresa_id, config);
    }

    async updateBranding(empresa_id, branding) {
        const pool = await connectDB();
        return await empresaModel.updateBranding(pool, empresa_id, branding);
    }

    async updateInventarioConfig(empresa_id, inv) {
        const pool = await connectDB();
        return await empresaModel.updateInventarioConfig(pool, empresa_id, inv);
    }

    async updateImpuestosConfig(empresa_id, imp) {
        const pool = await connectDB();
        return await empresaModel.updateImpuestosConfig(pool, empresa_id, imp);
    }

    async updateIntegracionesConfig(empresa_id, intConfig) {
        const pool = await connectDB();
        return await empresaModel.updateIntegracionesConfig(pool, empresa_id, intConfig);
    }

    async updateDashboardConfig(empresa_id, dash) {
        const pool = await connectDB();
        return await empresaModel.updateDashboardConfig(pool, empresa_id, dash);
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

const { connectDB } = require('../../config/db');
const monedaRepository = require('../../repositories/moneda.repository');

class MonedaService {
    async getAllMonedas() {
        const pool = await connectDB();
        return await monedaRepository.getAll(pool);
    }

    async getMonedaById(id) {
        const pool = await connectDB();
        return await monedaRepository.getById(pool, id);
    }

    async getLiveRates() {
        const cotizacionService = require('../../utils/cotizacion.service');
        return await cotizacionService.getCotizaciones();
    }
}

module.exports = new MonedaService();

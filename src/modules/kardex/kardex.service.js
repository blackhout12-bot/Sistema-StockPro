const { connectDB } = require('../../config/db');
const kardexRepo = require('../../repositories/kardex.repository');

class KardexService {
    async getKardexByProducto(producto_id, empresa_id) {
        const pool = await connectDB();
        return await kardexRepo.getByProducto(pool, producto_id, empresa_id);
    }

    async getInventarioValorizado(empresa_id) {
        const pool = await connectDB();
        const resumen = await kardexRepo.getResumenValorizado(pool, empresa_id);
        const total_valorizado = resumen.reduce((acc, curr) => acc + curr.valor_total, 0);
        return { total_valorizado, detalles: resumen };
    }
}

module.exports = new KardexService();

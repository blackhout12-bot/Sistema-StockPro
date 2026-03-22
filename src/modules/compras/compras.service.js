const { connectDB } = require('../../config/db');
const compraRepository = require('../../repositories/compra.repository');
const { deleteCache } = require('../../config/redis');

class ComprasService {
    async getAllCompras(empresa_id) {
        const pool = await connectDB();
        return await compraRepository.getAll(pool, empresa_id);
    }

    async getCompraById(id, empresa_id) {
        const pool = await connectDB();
        const compra = await compraRepository.getById(pool, id, empresa_id);
        if (!compra) {
            const error = new Error('Compra no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return compra;
    }

    async createCompra(data, usuario_id, empresa_id) {
        const pool = await connectDB();
        const compra_id = await compraRepository.create(pool, data, usuario_id, empresa_id);
        
        // Invalidar caché (ej. dashboard stats)
        await deleteCache(`stats:tenant_${empresa_id}`);
        
        return await compraRepository.getById(pool, compra_id, empresa_id);
    }
}

module.exports = new ComprasService();

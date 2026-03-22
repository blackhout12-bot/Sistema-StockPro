const { connectDB } = require('../../config/db');
const proveedorRepository = require('../../repositories/proveedor.repository');

class ProveedoresService {
    async getAllProveedores(empresa_id) {
        const pool = await connectDB();
        return await proveedorRepository.getAll(pool, empresa_id);
    }

    async getProveedorById(id, empresa_id) {
        const pool = await connectDB();
        const proveedor = await proveedorRepository.getById(pool, id, empresa_id);
        if (!proveedor) {
            const error = new Error('Proveedor no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return proveedor;
    }

    async createProveedor(data, empresa_id) {
        const pool = await connectDB();
        const insertId = await proveedorRepository.create(pool, data, empresa_id);
        return await proveedorRepository.getById(pool, insertId, empresa_id);
    }

    async updateProveedor(id, data, empresa_id) {
        const pool = await connectDB();
        await this.getProveedorById(id, empresa_id); // validación existencia
        await proveedorRepository.update(pool, id, data, empresa_id);
        return await proveedorRepository.getById(pool, id, empresa_id);
    }

    async deleteProveedor(id, empresa_id) {
        const pool = await connectDB();
        await this.getProveedorById(id, empresa_id); // validación
        await proveedorRepository.delete(pool, id, empresa_id);
    }
}

module.exports = new ProveedoresService();

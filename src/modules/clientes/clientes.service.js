const { connectDB } = require('../../config/db');
const clienteRepository = require('../../repositories/cliente.repository');

class ClienteService {
    async getAllClientes(empresa_id) {
        const pool = await connectDB();
        return await clienteRepository.getAll(pool, empresa_id);
    }

    async getClienteById(id, empresa_id) {
        const pool = await connectDB();
        return await clienteRepository.getById(pool, id, empresa_id);
    }

    async createCliente(clienteData, empresa_id) {
        const pool = await connectDB();
        const insertId = await clienteRepository.create(pool, clienteData, empresa_id);
        const newCliente = await clienteRepository.getById(pool, insertId, empresa_id);
        
        // Disparar Webhook
        const { notifyEvent } = require('../../utils/webhook.service');
        await notifyEvent(empresa_id, 'cliente.created', {
            cliente_id: insertId,
            nombre: newCliente.nombre,
            documento: newCliente.documento_identidad
        });

        return newCliente;
    }

    async updateCliente(id, clienteData, empresa_id) {
        const pool = await connectDB();
        await clienteRepository.update(pool, id, clienteData, empresa_id);
        return await clienteRepository.getById(pool, id, empresa_id);
    }

    async deleteCliente(id, empresa_id) {
        try {
            const pool = await connectDB();
            await clienteRepository.delete(pool, id, empresa_id);
        } catch (error) {
            if (error.message.includes('REFERENCE constraint')) {
                throw new Error('No se puede eliminar el cliente porque tiene facturas asociadas.');
            }
            throw error; // Re-throw preserving statusCode and stack
        }
    }
}

module.exports = new ClienteService();

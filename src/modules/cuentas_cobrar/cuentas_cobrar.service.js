const { connectDB } = require('../../config/db');
const cuentasCobrarRepo = require('../../repositories/cuentas_cobrar.repository');
const { deleteCache } = require('../../config/redis');

class CuentasCobrarService {
    async getAllCuentas(empresa_id) {
        const pool = await connectDB();
        return await cuentasCobrarRepo.getAll(pool, empresa_id);
    }

    async getCuentaById(id, empresa_id) {
        const pool = await connectDB();
        const cuenta = await cuentasCobrarRepo.getById(pool, id, empresa_id);
        if (!cuenta) {
            const error = new Error('Cuenta por cobrar no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return cuenta;
    }

    async registrarCobro(data, empresa_id) {
        if (!data.cuenta_cobrar_id || !data.monto_cobrado || !data.metodo_pago) {
            const error = new Error('Faltan campos requeridos (cuenta_cobrar_id, monto_cobrado, metodo_pago)');
            error.statusCode = 400;
            throw error;
        }

        const pool = await connectDB();
        
        await cuentasCobrarRepo.registrarCobro(pool, data, empresa_id);
        
        // Invalidar caché (stats financieros cambiarán)
        await deleteCache(`stats:tenant_${empresa_id}`);
        
        return await this.getCuentaById(data.cuenta_cobrar_id, empresa_id);
    }
}

module.exports = new CuentasCobrarService();

const { connectDB } = require('../../config/db');
const cuentasPagarRepo = require('../../repositories/cuentas_pagar.repository');
const { deleteCache } = require('../../config/redis');

class CuentasPagarService {
    async getAllCuentas(empresa_id) {
        const pool = await connectDB();
        return await cuentasPagarRepo.getAll(pool, empresa_id);
    }

    async getCuentaById(id, empresa_id) {
        const pool = await connectDB();
        const cuenta = await cuentasPagarRepo.getById(pool, id, empresa_id);
        if (!cuenta) {
            const error = new Error('Cuenta por pagar no encontrada');
            error.statusCode = 404;
            throw error;
        }
        return cuenta;
    }

    async registrarPago(data, empresa_id) {
        if (!data.cuenta_pagar_id || !data.monto_pagado || !data.metodo_pago) {
            const error = new Error('Faltan campos requeridos (cuenta_pagar_id, monto_pagado, metodo_pago)');
            error.statusCode = 400;
            throw error;
        }

        const pool = await connectDB();
        
        await cuentasPagarRepo.registrarPago(pool, data, empresa_id);
        
        // Invalidar caché (stats financieros pueden haber cambiado)
        await deleteCache(`stats:tenant_${empresa_id}`);
        
        return await this.getCuentaById(data.cuenta_pagar_id, empresa_id);
    }
}

module.exports = new CuentasPagarService();

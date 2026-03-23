const { connectDB } = require('../../config/db');
const facturacionRepository = require('../../repositories/facturacion.repository');
const { deleteCache } = require('../../config/redis');
const { notifyEvent } = require('../../utils/webhook.service');
const { afipQueue } = require('../../config/queue');
const logger = require('../../utils/logger');

class FacturacionService {
    async getAllFacturas(empresa_id, sucursal_id = null) {
        const pool = await connectDB();
        return await facturacionRepository.getAllFacturas(pool, empresa_id, sucursal_id);
    }

    async getFacturaById(id, empresa_id) {
        const pool = await connectDB();
        return await facturacionRepository.getFacturaById(pool, id, empresa_id);
    }

    async createFactura(facturaData, usuario_id, empresa_id) {
        const pool = await connectDB();
        const facturaId = await facturacionRepository.createFactura(pool, facturaData, usuario_id, empresa_id);
        
        // 1. Invalidamos caché porque cambiaron los ingresos de la empresa
        await deleteCache(`stats:tenant_${empresa_id}`);
        
        const facturaCompleta = await facturacionRepository.getFacturaById(pool, facturaId, empresa_id);

        // 2. Disparar Webhook
        try {
            await notifyEvent(empresa_id, 'factura.created', {
                factura_id: facturaId,
                numero: facturaCompleta.nro_factura,
                total: facturaCompleta.total,
                cliente_id: facturaData.cliente_id
            });
        } catch (webhookError) {
            logger.error({ webhookError: webhookError.message }, 'Failed to trigger invoice.created webhook');
        }

        // 3. Encolar autorización AFIP
        try {
            await afipQueue.add('authorize', { facturaId, empresaId: empresa_id });
        } catch (queueError) {
            logger.error({ queueError: queueError.message }, 'Failed to enqueue AFIP task');
            // Silent failure: we don't want to block the invoice creation if Redis is down
        }
        
        return facturaCompleta;
    }
}

module.exports = new FacturacionService();

const axios = require('axios');
const logger = require('./logger');

class MercadoPagoService {
    constructor() {
        this.accessToken = process.env.MP_ACCESS_TOKEN || 'TEST-MOCK-TOKEN';
        this.baseUrl = 'https://api.mercadopago.com';
    }

    /**
     * Generar un QR Dinámico para un punto de venta (Caja)
     * @param {Object} data { amount, external_reference, title, empresa_id }
     */
    async generarQR(data) {
        const { amount, external_reference, title, empresa_id } = data;

        // Mock simulation if no token or in dev
        if (this.accessToken === 'TEST-MOCK-TOKEN') {
            logger.info({ external_reference }, '[MP MOCK] Generando QR simulado');
            return {
                qr_data: '00020101021243110012COM.MERCADOPAGO0110304958302021110014023456789012345204000053030325802AR5916Antigravity Tech6011BUENOS AIRES62070703***6304E0C1',
                in_process: true,
                simulation: true
            };
        }

        try {
            // Nota: En MP, los QR se asocian a un user_id y un external_id (punto de venta)
            // Para simplificar esta implementación Senior, usamos el endpoint de Instore Orders
            const user_id = process.env.MP_USER_ID; 
            const external_pos_id = `CAJA_${empresa_id}`;

            const url = `${this.baseUrl}/instore/orders/qr/seller/collectors/${user_id}/pos/${external_pos_id}/qrs`;

            const payload = {
                external_reference,
                title,
                total_amount: amount,
                items: [
                    {
                        sku_number: external_reference,
                        category: 'marketplace',
                        title: title,
                        description: 'Venta de productos/servicios - Sistema Stock',
                        unit_price: amount,
                        quantity: 1,
                        unit_measure: 'unit',
                        total_amount: amount
                    }
                ],
                // El webhook a donde MP notificará el pago
                notification_url: `${process.env.APP_URL || 'https://tu-dominio.com'}/api/v1/facturacion/mercadopago/webhook`
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            logger.error({ 
                error: error.response?.data || error.message, 
                external_reference 
            }, 'Error generando QR en MercadoPago');
            throw new Error('No se pudo generar el código QR de pago.');
        }
    }

    /**
     * Verificar estado de un pago por su external_reference
     */
    async verificarPago(external_reference) {
        // Mock simulation
        if (this.accessToken === 'TEST-MOCK-TOKEN') {
            // Simulación: Si termina en par, está aprobado (para testear UI)
            const isApproved = parseInt(external_reference.slice(-1)) % 2 === 0;
            return {
                status: isApproved ? 'approved' : 'pending',
                simulation: true
            };
        }

        try {
            const url = `${this.baseUrl}/v1/payments/search?external_reference=${external_reference}`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });

            const payments = response.data.results;
            if (payments && payments.length > 0) {
                // Retornar el más reciente/relevante
                return {
                    status: payments[0].status,
                    payment_id: payments[0].id
                };
            }

            return { status: 'not_found' };
        } catch (error) {
            logger.error({ error: error.message, external_reference }, 'Error verificando pago en MercadoPago');
            return { status: 'error' };
        }
    }
}

module.exports = new MercadoPagoService();

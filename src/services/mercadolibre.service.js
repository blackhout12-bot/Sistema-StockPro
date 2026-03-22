const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Servicio Base para Sincronización con MercadoLibre
 * Administra la publicación de catálogos y la bajada de Pedidos/Ventas.
 */
class MercadoLibreService {
    constructor() {
        this.baseURL = 'https://api.mercadolibre.com';
    }

    /**
     * OAUTH 2.0 - Obtiene y refresca el Token Privado del vendedor.
     */
    async refreshTokenMock(empresa_id, refreshToken) {
        logger.info({ empresa_id }, 'Simulando Refresco de Token de MercadoLibre');
        return {
            access_token: 'APP_USR-3819283-simuladotoken',
            refresh_token: 'TG-6s81920-simulado',
            expires_in: 21600 // 6 horas
        };
    }

    /**
     * Sincroniza el inventario local hacia publicaciones activas de ML.
     */
    async sincronizarStockMock(empresa_id, productMeliId, nuevoStock) {
        logger.info({ empresa_id, productMeliId, nuevoStock }, 'Sincronizando Stock con ML (Mock)');
        // En Producción:
        // await axios.put(`${this.baseURL}/items/${productMeliId}`, { available_quantity: nuevoStock }, { headers: ... });
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }

    /**
     * Webhook Handler - Escucha nuevas órdenes generadas en ML y las convierte
     * en Facturas/Pedidos dentro del StockPro ERP.
     */
    async procesarNuevaOrdenMock(ordenPayload) {
        logger.info({ orderID: ordenPayload.id }, 'Procesando Nueva Orden de MercadoLibre...');
        return {
            erp_factura_id: 1042,
            estado_sincronizacion: 'COMPLETADO'
        };
    }
}

module.exports = new MercadoLibreService();

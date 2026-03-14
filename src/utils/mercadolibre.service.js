const axios = require('axios');
const logger = require('./logger');

class MercadoLibreService {
    constructor() {
        this.baseUrl = 'https://api.mercadolibre.com';
        // In personal/dev env, tokens would be in DB per company. 
        // For this Senior Implementation, we use a simulation mode by default.
    }

    /**
     * Sincronizar stock de un producto local con MercadoLibre
     * @param {Object} data { meli_item_id, availability, empresa_id }
     */
    async syncStock(data) {
        const { meli_item_id, availability, empresa_id } = data;

        if (!meli_item_id || meli_item_id === 'NOT_LINKED') {
            return { skipped: true, reason: 'Product not linked to MeLi' };
        }

        // --- Senior Simulation Mode ---
        // If no tokens found in env/db, we log the intent as per senior standards
        const accessToken = process.env.MELI_ACCESS_TOKEN;

        if (!accessToken || accessToken === 'TEST-MOCK') {
            logger.info({ 
                meli_item_id, 
                availability, 
                empresa_id 
            }, '[MeLi SYNC SIMULATION] Outbound Stock Update Sent');
            
            return {
                success: true,
                simulation: true,
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Documentación MeLi: PUT /items/{item_id} 
            // payload: { available_quantity: X }
            const response = await axios.put(
                `${this.baseUrl}/items/${meli_item_id}`,
                { available_quantity: availability },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            logger.info({ meli_item_id, status: response.status }, 'MercadoLibre Stock Sync Success');
            return response.data;
        } catch (error) {
            logger.error({ 
                error: error.response?.data || error.message, 
                meli_item_id 
            }, 'MercadoLibre Stock Sync Error');
            
            // In a real production system, we might move this to a retry queue (BullMQ)
            // but for now we log it and return failure.
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener el estado actual de una publicación
     */
    async getItemStatus(meli_item_id) {
        try {
            const response = await axios.get(`${this.baseUrl}/items/${meli_item_id}`);
            return response.data;
        } catch (error) {
            return null;
        }
    }
}

module.exports = new MercadoLibreService();

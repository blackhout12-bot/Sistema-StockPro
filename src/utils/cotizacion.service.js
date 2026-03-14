const logger = require('./logger');

class CotizacionService {
    constructor() {
        this.cache = new Map();
        this.TTL = 1000 * 60 * 30; // 30 minutos
    }

    /**
     * Obtiene la cotización del dólar oficial
     * Fuente: dolarapi.com
     */
    async getDolarOficial() {
        const cacheKey = 'dolar_oficial';
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < this.TTL)) {
            return cached.data;
        }

        try {
            const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
            if (!response.ok) throw new Error('Error al conectar con DolarApi');
            
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data: data.venta,
                timestamp: Date.now()
            });

            return data.venta;
        } catch (error) {
            logger.error({ error: error.message }, 'Error consultando cotización dólar. Usando fallback.');
            // Fallback razonable si la API cae
            return 1050.00; 
        }
    }

    /**
     * Obtiene cotizaciones múltiples
     */
    async getCotizaciones() {
        const oficial = await this.getDolarOficial();
        return {
            USD: oficial,
            EUR: oficial * 1.1, // Estimación simple o podrías consultar otra API
            ARS: 1
        };
    }
}

module.exports = new CotizacionService();

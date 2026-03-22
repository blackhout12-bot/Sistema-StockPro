const Afip = require('@afipsdk/afip.js');
const logger = require('../utils/logger');

/**
 * Servicio Base para Facturación Electrónica (AFIP Argentina)
 * Permite emitir Facturas A, B, C y Notas de Crédito, y obtener el CAE.
 * Requiere configuración de CUIT y Certificados de Producción/Homo.
 */
class AfipService {
    constructor() {
        // Inicialización tardía o por tenant.
        // En multi-tenant, cada empresa tendrá su propio CUIT y certificado CSR+KEY.
        this.afipInstances = {}; 
    }

    /**
     * Inicializa o recupera una instancia de AFIP para un tenant específico
     */
    async getAfipInstance(empresa_id, cuit, certPath, keyPath, production = false) {
        if (!this.afipInstances[empresa_id]) {
            this.afipInstances[empresa_id] = new Afip({
                CUIT: cuit,
                cert: certPath,
                key: keyPath,
                production: production
            });
            logger.info({ empresa_id, cuit }, 'Instancia AFIP SDK Inicializada');
        }
        return this.afipInstances[empresa_id];
    }

    /**
     * Mock Principal para Autorizar un Comprobante Electrónico (Obtener CAE)
     */
    async emitirFacturaMock(payload) {
        try {
            logger.info('Simulando Emisión de Factura AFIP (Mock Mode)');
            // En Producción: 
            // const afip = await this.getAfipInstance(...);
            // const res = await afip.ElectronicBilling.createVoucher(payload);
            
            // Simulación de retraso de red
            await new Promise(resolve => setTimeout(resolve, 800));

            return {
                CAE: '71429813291823', // CAE Simulado
                CAEFchVto: '20271231',
                punto_venta: payload.PtoVta,
                cbte_nro: payload.CbteDesde
            };
        } catch (error) {
            logger.error({ err: error.message }, 'Error simulado en AFIP API');
            throw new Error('AFIP Error: No se pudo autorizar el comprobante.');
        }
    }

    async getUltimoComprobanteMock(puntoVenta, tipoCbte) {
        return Math.floor(Math.random() * 1000) + 1;
    }
}

module.exports = new AfipService();

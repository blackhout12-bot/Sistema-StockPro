const Afip = require('@afipsdk/afip.js');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class AfipService {
    /**
     * Inicializa el SDK de AFIP para una empresa específica
     */
    async getAfipInstance(empresa) {
        // En producción, los certificados deberían estar en una ruta segura
        // Para este arquetipo, permitimos rutas configurables o un fallback a 'certs' global
        const certPath = empresa.afip_certificado_path || path.join(__dirname, '../../certs/prod.crt');
        const keyPath = empresa.afip_key_path || path.join(__dirname, '../../certs/prod.key');

        return new Afip({
            CUIT: empresa.afip_cuit,
            cert: certPath,
            key: keyPath,
            production: process.env.NODE_ENV === 'production'
        });
    }

    /**
     * Solicita el CAE para una factura
     */
    async solicitarCAE(empresa, factura, detalles) {
        try {
            const afip = await this.getAfipInstance(empresa);
            
            // Mapeo de tipos de comprobante a códigos AFIP
            const typeMapping = {
                'factura a': 1,
                'factura b': 6,
                'factura c': 11,
                'nota de crédito a': 3,
                'nota de crédito b': 8,
                'nota de crédito c': 13
            };
            const cbteTipo = typeMapping[factura.tipo_comprobante.toLowerCase()] || 11;

            const lastVoucher = await afip.ElectronicBilling.getLastVoucher(empresa.afip_punto_venta, cbteTipo);
            const nextVoucher = lastVoucher + 1;

            const date = new Date(factura.fecha_emision || Date.now()).toISOString().split('T')[0].replace(/-/g, '');

            // Determinar DocTipo: 80 (CUIT), 96 (DNI), 99 (Consumidor Final / Sin documento)
            let docTipo = 99;
            let docNro = 0;
            
            if (factura.cliente_doc_snapshot) {
                const cleanDoc = factura.cliente_doc_snapshot.replace(/-/g, '').trim();
                docNro = parseInt(cleanDoc);
                if (cleanDoc.length === 11) {
                    docTipo = 80; // CUIT
                } else if (cleanDoc.length >= 7 && cleanDoc.length <= 8) {
                    docTipo = 96; // DNI
                }
            }

            // Cálculo de IVA (Base + Importe)
            // En un sistema real, esto vendría desglosado del repo. 
            // Aquí hacemos un cálculo defensivo asumiendo 21% si no hay discriminación.
            const impNeto = Math.round((factura.total / 1.21) * 100) / 100;
            const impIva = Math.round((factura.total - impNeto) * 100) / 100;

            const data = {
                'CantReg': 1,
                'PtoVta': empresa.afip_punto_venta,
                'CbteTipo': cbteTipo,
                'Concepto': 1, // 1: Productos
                'DocTipo': docTipo,
                'DocNro': docNro,
                'CbteDesde': nextVoucher,
                'CbteHasta': nextVoucher,
                'CbteFch': date,
                'ImpTotal': factura.total,
                'ImpTotConc': 0,
                'ImpNeto': impNeto,
                'ImpOpEx': 0,
                'ImpIVA': impIva,
                'ImpTrib': 0,
                'MonId': factura.moneda_id === 'USD' ? 'DOL' : 'PES',
                'MonCot': factura.tipo_cambio || 1,
                'Iva': [
                    {
                        'Id': 5, // 5: 21%
                        'BaseImp': impNeto,
                        'Importe': impIva
                    }
                ]
            };

            const res = await afip.ElectronicBilling.createVoucher(data);
            
            return {
                cae: res.CAE,
                vencimiento: res.CAEFchVto,
                nro_afip: nextVoucher
            };

        } catch (error) {
            logger.error({ error: error.message, empresa_id: empresa.id, factura_id: factura.id }, 'Error al solicitar CAE en AFIP');
            throw error;
        }
    }
}

module.exports = new AfipService();

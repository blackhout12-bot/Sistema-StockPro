const { Worker } = require('bullmq');
const { redisConnectionParams } = require('../config/redis');
const afipService = require('../services/afip.service');
const { connectDB, sql } = require('../config/db');
const logger = require('../utils/logger');

const afipWorker = new Worker('afip-authorization', async job => {
    const { facturaId, empresaId } = job.data;
    const pool = await connectDB();

    try {
        logger.info({ facturaId }, 'Procesando autorización AFIP...');

        // 1. Obtener datos de la factura y empresa
        const query = `
            SELECT f.*, e.* 
            FROM Facturas f
            JOIN Empresa e ON f.empresa_id = e.id
            WHERE f.id = @fid AND f.empresa_id = @eid
        `;
        const result = await pool.request()
            .input('fid', sql.Int, facturaId)
            .input('eid', sql.Int, empresaId)
            .query(query);

        if (result.recordset.length === 0) throw new Error('Factura o Empresa no encontrada');
        const data = result.recordset[0];

        // 2. Obtener detalles para el desglose de IVA (si aplica)
        const detResult = await pool.request()
            .input('fid', sql.Int, facturaId)
            .query('SELECT * FROM Detalle_Facturas WHERE factura_id = @fid');
        const detalles = detResult.recordset;

        // 3. Preparar Configuración AFIP desde tabla Empresa
        const afipConfig = {
            empresa_id: data.empresa_id,
            cuit: data.afip_cuit || data.documento_identidad, // Asume CUIT en tabla empresa
            certPath: data.afip_cert_path || '/dev/null',
            keyPath: data.afip_key_path || '/dev/null',
            isProduction: data.afip_production || false
        };

        // Preparar el Payload Técnico WSFEV1 
        const payload = {
            CantReg: 1,
            PtoVta: data.punto_venta || 1,
            CbteTipo: 6, // 6 = Factura B, 1 = Factura A, 11 = Factura C (simplificado a 6 por defecto)
            Concepto: 1, // 1 = Productos
            DocTipo: 99, // 99 = Consumidor Final, 80 = CUIT
            DocNro: data.cliente_doc || 0,
            CbteDesde: 1, // afipService.getUltimoComprobante() devolvería esto, asumo 1 por fallback
            CbteHasta: 1,
            CbteFch: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
            ImpTotal: data.total,
            ImpTotConc: 0,
            ImpNeto: data.total, // Asume responsable monotributo o exento (C/B)
            ImpOpEx: 0,
            ImpTrub: 0,
            ImpIVA: 0,
            FchServDesde: '',
            FchServHasta: '',
            FchVtoPago: '',
            MonId: 'PES',
            MonCotiz: 1
        };

        // 4. Solicitar Emisión Real al WebService AFIP
        const afipResponse = await afipService.emitirFactura(afipConfig, payload);

        // 5. Actualizar factura con CAE en Base de Datos MSSQL
        await pool.request()
            .input('fid', sql.Int, facturaId)
            .input('cae', sql.NVarChar, afipResponse.CAE)
            .input('vto', sql.VarChar(50), afipResponse.CAEFchVto)
            .query("UPDATE Facturas SET afip_cae = @cae, afip_cae_vto = @vto, estado = 'Fiscalizada' WHERE id = @fid");

        logger.info({ facturaId, cae: afipResponse.CAE }, 'Factura autorizada por AFIP exitosamente.');
        return { success: true, cae: afipResponse.CAE };

    } catch (error) {
        logger.error({ error: error.message, facturaId }, 'Error en AFIP Worker');
        throw error;
    }
}, { connection: redisConnectionParams });

afipWorker.on('failed', (job, err) => {
    logger.error({ jobId: job ? job.id : 'unknown', err: err.message }, 'AFIP Worker Job Failed');
});

afipWorker.on('error', (err) => {
    // Silenced for graceful degradation when Redis is offline.
});

module.exports = afipWorker;

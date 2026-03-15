const { Worker } = require('bullmq');
const { redisConnectionParams } = require('../config/redis');
const afipService = require('../utils/afip.service');
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

        // 3. Solicitar CAE
        const { cae, vencimiento, nro_afip } = await afipService.solicitarCAE(data, data, detalles);

        // 4. Actualizar factura
        await pool.request()
            .input('fid', sql.Int, facturaId)
            .input('cae', sql.NVarChar, cae)
            .input('vto', sql.Date, vencimiento)
            .query("UPDATE Facturas SET afip_cae = @cae, afip_cae_vto = @vto, estado = 'Fiscalizada' WHERE id = @fid");

        logger.info({ facturaId, cae }, 'Factura autorizada por AFIP exitosamente.');
        return { success: true, cae };

    } catch (error) {
        logger.error({ error: error.message, facturaId }, 'Error en AFIP Worker');
        throw error;
    }
}, { connection: redisConnectionParams });

afipWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, err: err.message }, 'AFIP Worker Job Failed');
});

afipWorker.on('error', (err) => {
    // Silenced for graceful degradation when Redis is offline.
});

module.exports = afipWorker;

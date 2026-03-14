// src/modules/externalAuth/webhook.controller.js
const crypto = require('crypto');
const { connectDB } = require('../../config/db');
const sql = require('mssql');

// Para firmas HMAC
const APP_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mi-secreto-compartido-externo';

class WebhookController {
    
    async handleWebhook(req, res, next) {
        try {
            const signature = req.headers['x-hub-signature-256'];
            const payload = JSON.stringify(req.body);

            let status = 'SUCCESS';
            let errorMsg = null;

            // Validación HMAC para seguridad
            if (signature) {
                const expectedSignature = 'sha256=' + crypto.createHmac('sha256', APP_WEBHOOK_SECRET)
                    .update(payload)
                    .digest('hex');
                
                if (signature !== expectedSignature) {
                    status = 'FAILED_HMAC';
                    errorMsg = 'Firma HMAC inválida';
                }
            } else {
                status = 'WARNING_NO_HMAC';
            }

            // Evitar procesar si falló el HMAC drásticamente
            if (status === 'FAILED_HMAC') {
                return res.status(401).json({ error: errorMsg });
            }

            const eventType = req.body?.event || 'unknown';

            // Auditar log de integración
            const pool = await connectDB();
            try {
                await pool.request()
                    .input('empresa_id', sql.Int, req.tenant_id)
                    .input('payload', sql.NVarChar(sql.MAX), payload)
                    .input('estado', sql.VarChar(50), status)
                    .input('error_msg', sql.NVarChar(sql.MAX), errorMsg)
                    .query(`
                        IF OBJECT_ID('IntegracionLogs', 'U') IS NOT NULL
                        BEGIN
                            INSERT INTO IntegracionLogs (empresa_id, fecha, payload, estado, error_msg)
                            VALUES (@empresa_id, GETDATE(), @payload, @estado, @error_msg)
                        END
                    `);
            } catch(e) {
                console.warn('[Webhook] Tabla IntegracionLogs no migrada. Evento procesado en memoria.');
            }

            res.status(200).json({ received: true, event: eventType, status });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WebhookController();

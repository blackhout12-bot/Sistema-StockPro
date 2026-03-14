// src/modules/notificaciones/webhooks.v2.controller.js
const express = require('express');
const router = express.Router();
const { sql } = require('../../config/db');
const logger = require('../../utils/logger');
const { z } = require('zod');

// Schema para validar suscripción
const webhookSchema = z.object({
    url_destino: z.string().url(),
    evento: z.enum(['stock.updated', 'factura.created', 'cliente.created']),
    secret_token: z.string().max(255).optional()
});

/**
 * Listar webhooks de la empresa
 */
router.get('/', async (req, res) => {
    try {
        const pool = await sql;
        const result = await pool.request()
            .input('empresaId', sql.Int, req.empresaId)
            .query('SELECT id, url_destino, evento, activo, fecha_creacion FROM Webhooks WHERE empresa_id = @empresaId');
        
        res.json(result.recordset);
    } catch (err) {
        logger.error({ err, empresaId: req.empresaId }, 'Error listando webhooks');
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * Crear suscripción
 */
router.post('/', async (req, res) => {
    try {
        const data = webhookSchema.parse(req.body);
        const pool = await sql;
        
        await pool.request()
            .input('empresaId', sql.Int, req.empresaId)
            .input('url', sql.NVarChar, data.url_destino)
            .input('evento', sql.NVarChar, data.evento)
            .input('secret', sql.NVarChar, data.secret_token || null)
            .query(`
                INSERT INTO Webhooks (empresa_id, url_destino, evento, secret_token)
                VALUES (@empresaId, @url, @evento, @secret)
            `);
            
        res.status(201).json({ message: 'Suscripción de webhook creada' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors });
        }
        logger.error({ err, empresaId: req.empresaId }, 'Error creando webhook');
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * Eliminar suscripción
 */
router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('empresaId', sql.Int, req.empresaId)
            .query('DELETE FROM Webhooks WHERE id = @id AND empresa_id = @empresaId');
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Webhook no encontrado' });
        }
        
        res.json({ message: 'Suscripción eliminada' });
    } catch (err) {
        logger.error({ err, empresaId: req.empresaId }, 'Error eliminando webhook');
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;

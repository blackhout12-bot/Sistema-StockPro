// src/middlewares/verifyApiKey.js
const { connectReadOnlyDB } = require('../config/db');
const sql = require('mssql');

const verifyApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'Falta x-api-key en los headers' });
    }

    try {
        const pool = await connectReadOnlyDB();
        // Buscar la empresa que tiene este API Key en int_erp_key
        const result = await pool.request()
            .input('api_key', sql.NVarChar(500), apiKey)
            .query('SELECT id, nombre, plan_activo FROM Empresa WHERE int_erp_key = @api_key');

        const empresa = result.recordset[0];
        if (!empresa) {
            return res.status(401).json({ error: 'API Key inválida o no registrada' });
        }

        // Inyectar el tenant y la información de la empresa en el request
        req.tenant_id = empresa.id;
        req.api_user = {
            empresa_id: empresa.id,
            nombre: empresa.nombre,
            plan: empresa.plan_activo
        };

        next();
    } catch (err) {
        console.error('Error verifying API Key:', err.message);
        res.status(500).json({ error: 'Error interno validando API Key' });
    }
};

module.exports = verifyApiKey;

const axios = require('axios');
const logger = require('../utils/logger');
const { connectDB, sql } = require('../config/db');

/**
 * Servicio Autorizador y Sincronizador para MercadoLibre
 * Implementación de OAUTH 2.0 API V2 y Webhooks
 */
class MercadoLibreService {
    constructor() {
        this.baseURL = 'https://api.mercadolibre.com';
    }

    /**
     * OAUTH 2.0 - Paso 1: Generar URL de Autorización (Login)
     */
    getAuthUrl(empresa_id) {
        const appId = process.env.MELI_APP_ID;
        const redirectUri = process.env.MELI_REDIRECT_URI;
        if (!appId || !redirectUri) return null;
        return `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}&state=${empresa_id}`;
    }

    /**
     * OAUTH 2.0 - Paso 2: Intercambiar CODE por ACCESS_TOKEN
     */
    async authorize(empresa_id, code) {
        try {
            const body = {
                grant_type: 'authorization_code',
                client_id: process.env.MELI_APP_ID,
                client_secret: process.env.MELI_CLIENT_SECRET,
                code: code,
                redirect_uri: process.env.MELI_REDIRECT_URI
            };

            const response = await axios.post(`${this.baseURL}/oauth/token`, new URLSearchParams(body));
            await this._saveTokens(empresa_id, response.data);
            return response.data;
        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, 'Fallo en autorización OAUTH Meli');
            throw new Error('Error vinculando cuenta de MercadoLibre.');
        }
    }

    /**
     * OAUTH 2.0 - Paso 3: Refrescar el token expirado
     */
    async refreshToken(empresa_id, refreshToken) {
        try {
            const body = {
                grant_type: 'refresh_token',
                client_id: process.env.MELI_APP_ID,
                client_secret: process.env.MELI_CLIENT_SECRET,
                refresh_token: refreshToken
            };
            const response = await axios.post(`${this.baseURL}/oauth/token`, new URLSearchParams(body));
            await this._saveTokens(empresa_id, response.data);
            return response.data;
        } catch (error) {
            logger.error({ err: error.response?.data || error.message }, 'Fallo al refrescar token Meli');
            throw new Error('El token de MercadoLibre caducó. Requiere relogueo.');
        }
    }

    /**
     * Valida que la empresa tenga integraciones activas. Retorna los tokens.
     */
    async getStoredTokens(empresa_id) {
        const pool = await connectDB();
        const res = await pool.request().input('eid', sql.Int, empresa_id)
            .query("SELECT meli_access_token, meli_refresh_token, meli_token_expires FROM Empresa WHERE id = @eid AND meli_access_token IS NOT NULL");
        
        if (res.recordset.length === 0) return null;
        let data = res.recordset[0];

        // Verificar expiración
        if (new Date() >= new Date(data.meli_token_expires)) {
            logger.warn('Token Meli Expirado. Intentando refrescar automáticamente...');
            const newTokens = await this.refreshToken(empresa_id, data.meli_refresh_token);
            data.meli_access_token = newTokens.access_token;
        }
        return data.meli_access_token;
    }

    /**
     * Persiste los tokens generados de forma segura en la base de datos de la Empresa.
     */
    async _saveTokens(empresa_id, tokenData) {
        const pool = await connectDB();
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + tokenData.expires_in - 300); // margen 5 min

        // Utilizamos chequeo de columna resiliente
        const cols = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Empresa')").then(r => r.recordset.map(c => c.name));
        if (!cols.includes('meli_access_token')) {
            // Migrar sobre la marcha si el usuario recién instala el módulo
            await pool.request().query("ALTER TABLE Empresa ADD meli_access_token VARCHAR(255), meli_refresh_token VARCHAR(255), meli_token_expires DATETIME2");
        }

        await pool.request()
            .input('eid', sql.Int, empresa_id)
            .input('acc', sql.VarChar(255), tokenData.access_token)
            .input('ref', sql.VarChar(255), tokenData.refresh_token)
            .input('exp', sql.DateTime2, expirationDate)
            .query("UPDATE Empresa SET meli_access_token = @acc, meli_refresh_token = @ref, meli_token_expires = @exp WHERE id = @eid");
    }

    /**
     * Webhook Handler - Recupera los detalles de la orden a partir de su ID utilizando el token
     */
    async fetchOrderDetails(empresa_id, orderId) {
        const token = await this.getStoredTokens(empresa_id);
        if (!token) throw new Error('No hay tokens validos para recuperar la orden.');

        try {
            const response = await axios.get(`${this.baseURL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            logger.error({ orderId, err: error.response?.data?.message }, 'No se pudo obtener el detalle de la Orden.');
            throw error;
        }
    }
}

module.exports = new MercadoLibreService();

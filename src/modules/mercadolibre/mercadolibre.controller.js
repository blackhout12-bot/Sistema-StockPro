const mercadolibreService = require('../../services/mercadolibre.service');
const logger = require('../../utils/logger');
const { afipQueue } = require('../../config/queue'); // Si necesitaramos encolar algo
const { connectDB, sql } = require('../../config/db');

class MercadoLibreController {
    /**
     * Devuelve la URL de Login para MercadoLibre.
     * GET /api/v1/mercadolibre/auth
     * Protegido por JWT (req.empresa_id)
     */
    async getAuthUrl(req, res, next) {
        try {
            const url = mercadolibreService.getAuthUrl(req.empresa_id);
            if (!url) return res.status(500).json({ error: 'Configuración MELI incompleta en el servidor.' });
            res.json({ url });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Callback invocado por MercadoLibre luego de que el usuario acepta los permisos.
     * GET /api/v1/mercadolibre/callback?code=XXXX&state=empresa_id
     */
    async callback(req, res, next) {
        try {
            const { code, state, error, error_description } = req.query;

            if (error) {
                logger.error({ error, error_description }, 'MercadoLibre OAuth Denegado');
                return res.status(400).send(`Error de Autorización: ${error_description}`);
            }

            if (!code || !state) {
                return res.status(400).send('Parámetros de autorización inválidos.');
            }

            const empresa_id = parseInt(state, 10);
            
            // Intercambiar CODE por Token Real
            await mercadolibreService.authorize(empresa_id, code);

            logger.info({ empresa_id }, 'Vinculación exitosa con MercadoLibre OAUTH v2');
            
            // Redirigir al Frontend (a una página de éxito)
            res.send(`
                <html><body>
                <h2>Vinculación Exitosa con MercadoLibre!</h2>
                <p>Puedes cerrar esta ventana y volver al sistema StockPro.</p>
                <script>setTimeout(() => window.close(), 3000);</script>
                </body></html>
            `);
        } catch (error) {
            logger.error({ err: error.message }, 'Meli Callback Error');
            res.status(500).send('Falló la vinculación con MercadoLibre. Contacte soporte.');
        }
    }

    /**
     * Webhook Endpoint que recibe notificaciones de MercadoLibre (Público)
     * POST /api/public/mercadolibre/webhook
     */
    async handleWebhook(req, res, next) {
        // Responder 200 OK inmediatamente como requiere MercadoLibre
        res.status(200).send('OK');

        try {
            const payload = req.body;
            logger.info({ topic: payload.topic, resource: payload.resource }, 'Recibido Webhook de MercadoLibre');

            // payload.user_id = El ID de vendedor en Meli (APP_USR-...)
            // Debemos buscar a qué empresa_id le pertenece este user_id
            // Como este es un boilerplate, procesaremos ordenes:
            
            if (payload.topic === 'orders_v2') {
                const orderId = payload.resource.split('/').pop();
                
                // 1. Resolver Empresa_ID a partir del user_id del vendedor
                const pool = await connectDB();
                const userRes = await pool.request()
                    .input('meli_user_id', sql.VarChar(50), payload.user_id?.toString())
                    // Asumimos que pusimos meli_user_id en la tabla Empresa (fallback a empresa 1 para ejemplo si no existe)
                    .query("SELECT id FROM Empresa WHERE meli_user_id = @meli_user_id");
                
                let empresa_id = userRes.recordset[0]?.id || 1; 

                // 2. Fetcher detalles de la orden a la API de ML
                const orderData = await mercadolibreService.fetchOrderDetails(empresa_id, orderId);
                
                if (orderData.status === 'paid') {
                    // 3. (Mock) Inyectar la orden en nuestra DB de Facturas/Ventas
                    logger.info({ orderId, empresa_id, total: orderData.total_amount }, 'Orden de Meli Cobrada. Registrando Facturador...');
                    // Aqui iria la lógica real de insertar los items en Detalle_Facturas, descontar stock, y emitir Factura AFIP.
                }
            }

        } catch (error) {
            logger.error({ err: error.message }, 'Error al procesar Webhook de ML');
        }
    }
}

module.exports = new MercadoLibreController();

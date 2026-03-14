// src/services/notification.service.js
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

class NotificationService {
    
    /**
     * Envía una notificación Push (Simulada usando Mock Firebase/OneSignal)
     * @param {Object} payload 
     * @param {number} tenant_id 
     */
    async sendPushNotification(payload, tenant_id) {
        logger.info(`[Push] Enviando a tenant ${tenant_id}: ${payload.title} - ${payload.body}`);
        // Aquí iría la integración real con FCM admin SDK o OneSignal
        return true;
    }

    /**
     * Envía un email automatizado (Simulado)
     * @param {string} to 
     * @param {string} subject 
     * @param {string} htmlTemplate 
     */
    async sendEmail(to, subject, htmlTemplate) {
        logger.info(`[Email] Enviando a ${to} - Tema: ${subject}`);
        // Aquí iría la integración con Nodemailer o SendGrid
        return true;
    }

    /**
     * Registra una alerta en la tabla de Alertas o Log interno del dashboard Web
     */
    async registerWebAlert(pool, tenant_id, type, message, severity) {
        try {
            // Ejemplo de persistencia de alerta si existiera una tabla Alertas
            // await pool.request()
            //    .input(...)
            //    .query('INSERT INTO Alertas ...')
            logger.info(`[Web Alert] Tenant: ${tenant_id} | [${severity}] ${type}: ${message}`);
            
            // Si estuviéramos conectados con socket.io podríamos emitir aquí:
            // io.to(\`empresa_\${tenant_id}\`).emit('nueva_alerta', { type, message, severity });
            return true;
        } catch (error) {
            logger.error('Error registrando alerta web:', error.message);
            return false;
        }
    }
}

module.exports = new NotificationService();

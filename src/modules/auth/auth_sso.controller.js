const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * Endpoint para iniciar flujo de Google SSO
 */
router.get('/google', (req, res) => {
    logger.info('Iniciando flujo Google SSO');
    // En una implementación real, aquí redirigiríamos a la URL de Google OAuth2
    res.json({ 
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        client_id: process.env.GOOGLE_CLIENT_ID || 'MOCK_GOOGLE_ID',
        simulation: true 
    });
});

/**
 * Callback de Google SSO
 */
router.post('/google/callback', async (req, res) => {
    try {
        const { code } = req.body;
        logger.info({ code }, 'Recibido callback de Google SSO');
        
        // Simulación: Generar un token para un usuario de prueba
        const mockUser = {
            id: 1,
            email: 'user@gmail.com',
            nombre: 'Google User',
            empresa_id: 1,
            rol: 'admin'
        };

        const token = jwt.sign(
            { id: mockUser.id, email: mockUser.email, empresa_id: mockUser.empresa_id, rol: mockUser.rol },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({ token, user: mockUser });
    } catch (error) {
        logger.error({ err: error.message }, 'Error en Google SSO Callback');
        res.status(500).json({ error: 'Fallo en la autenticación' });
    }
});

/**
 * Microsoft 365 SSO
 */
router.get('/microsoft', (req, res) => {
    logger.info('Iniciando flujo Microsoft 365 SSO');
    res.json({ 
        url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        client_id: process.env.MS_CLIENT_ID || 'MOCK_MS_ID',
        simulation: true 
    });
});

module.exports = router;

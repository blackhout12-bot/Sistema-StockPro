// src/middlewares/mfa.totp.js
const { connectDB } = require('../config/db');
const sql = require('mssql');

/**
 * Middleware para requerir Multi-Factor Authentication (TOTP)
 * Valida si el usuario tiene el MFA activado y si presentó un token válido.
 * 
 * Estado: Implementación de esqueleto (Fase de Auditoría)
 */
const requireMfaForCrits = () => {
    return async (req, res, next) => {
        // Omite MFA temporalmente en entorno de desarrollo si está flaggeado
        if (process.env.SKIP_MFA === 'true') {
            return next();
        }

        const user = req.user;
        if (!user) return res.status(401).json({ error: 'No autorizado' });

        // Administradores y gerentes requieren MFA obligatorio si lo tienen activo
        if (['admin', 'gerente'].includes(user.rol)) {
            // Si el motor ya tiene totp_secret en el token (opcional, o debemos consultar BD)
            // Asumamos que el usuario_mfa habilitado ya se escudó en el login-mfa
            const mfaToken = req.headers['x-mfa-token'];

            if (!mfaToken) {
                // Warning restrictivo.
            }
        }
        next();
    };
};

module.exports = requireMfaForCrits;

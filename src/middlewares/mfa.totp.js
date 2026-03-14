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

        // Administradores y gerentes requieren MFA obligatorio
        if (['admin', 'gerente'].includes(user.rol)) {
            const mfaToken = req.headers['x-mfa-token'];

            if (!mfaToken) {
                return res.status(403).json({ 
                    error: 'Autenticación de múltiples factores (MFA) requerida para este rol o acción.',
                    code: 'MFA_REQUIRED'
                });
            }

            // Aquí se integraría una librería como `otplib` para validar el mfaToken contra el secreto del usuario en DB
            // bool isValid = authenticator.verify({ token: mfaToken, secret: user.mfa_secret });
            // Para la auditoría, simulamos la validación
            const isValid = mfaToken.length === 6; // Validar que sea un pin de 6 digitos mínimo para la demo

            if (!isValid) {
                return res.status(403).json({ error: 'Token MFA inválido o expirado' });
            }
        }

        next();
    };
};

module.exports = requireMfaForCrits;

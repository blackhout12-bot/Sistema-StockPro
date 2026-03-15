const { connectDB, sql } = require('../../config/db');
const authRepo = require('../../repositories/auth.repository');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo_cambiar_en_produccion';

class SSOController {

    // Helper: Registrar intento SSO en Base de Datos (Auditoría Inmutable)
    async logSSOAttempt(pool, email, proveedor, ip, exito, detalles = null) {
        try {
            await pool.request()
                .input('email', sql.NVarChar(255), email)
                .input('proveedor', sql.NVarChar(50), proveedor)
                .input('ip', sql.VarChar(50), ip)
                .input('exito', sql.Bit, exito ? 1 : 0)
                .input('detalles', sql.NVarChar(sql.MAX), detalles ? JSON.stringify(detalles) : null)
                .query(`
                    INSERT INTO SSOLog (email, proveedor, ip, exito, detalles)
                    VALUES (@email, @proveedor, @ip, @exito, @detalles)
                `);
        } catch (e) {
            console.error('Error logging SSO attempt:', e);
        }
    }

    // Callback Generico para OpenID Connect (Google/MS365 Mockeado para demostración de arquitectura)
    async handleOAuthCallback(req, res, next) {
        try {
            const { provider } = req.params; 
            const { email, name, mfa_verified } = req.body; // Simulación de carga útil validada de proveedor OpenID
            
            const pool = await connectDB();

            if (!email || !provider) {
                await this.logSSOAttempt(pool, email || 'unknown', provider || 'unknown', req.ip, false, { error: 'Falta email o proveedor en Token SSO' });
                return res.status(400).json({ error: 'Payload SSO inválido' });
            }

            // Validar MFA (Simulado en este scaffold)
            if (req.body.requires_mfa && !mfa_verified) {
                await this.logSSOAttempt(pool, email, provider, req.ip, false, { error: 'Falló validación MFA' });
                return res.status(401).json({ error: 'Autenticación Multi-Factor requerida' });
            }

            // 1. Buscar si el usuario existe en nuestro DB
            let usuario = await authRepo.obtenerUsuarioPorEmail(email);
            
            // 2. Mapeo Automático de Roles según Grupos de Directorio Activo (Mock)
            const roleAssigned = (email.includes('admin') || email.includes('gerente')) ? 'admin' : 'vendedor';

            if (!usuario) {
                // Auto-Provisionamiento de cuentas (Just-In-Time Provisioning)
                const saltRounds = 10;
                // Contraseña inútil porque la auto maneja SSO
                const dummyPassword = require('crypto').randomBytes(20).toString('hex'); 
                const bcrypt = require('bcryptjs');
                const passwordHash = await bcrypt.hash(dummyPassword, saltRounds);
                
                // Mapear a la Empresa Global #1 para facilitar el mock
                usuario = await authRepo.crearUsuario(name || email.split('@')[0], email, passwordHash, roleAssigned, 1);
            }

            // 3. Obtener membresías Multi-Tenant
            const membresias = await authRepo.obtenerMembresiasPorUsuario(usuario.id);

            // Log exitoso
            await this.logSSOAttempt(pool, email, provider, req.ip, true, { uid: usuario.id, tenantCount: membresias.length });

            // 4. Generar JWT (Rotación y Expiración configurada según OWASP)
            let token = null;
            let payloadRes = {};

            if (membresias.length === 0) {
                return res.status(403).json({ error: 'SSO Exitoso, pero no estás asignado a ninguna Empresa en este sistema' });
            } 
            else if (membresias.length === 1) {
                const mem = membresias[0];
                const tokenPayload = {
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    rol: mem.rol,
                    empresa_id: mem.empresa_id,
                    sso_provider: provider
                };
                token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' }); // JWT Rotation compliance
                payloadRes = {
                    token,
                    user: tokenPayload,
                    message: "SSO Login Exitoso"
                };
            } 
            else {
                // Requiere selección de empresa
                payloadRes = {
                    requires_empresa_select: true,
                    usuario_id: usuario.id,
                    empresas: membresias,
                    message: "SSO Exitoso. Seleccione empresa para continuar."
                };
            }

            res.json(payloadRes);

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SSOController();

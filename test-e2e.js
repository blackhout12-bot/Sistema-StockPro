const speakeasy = require('speakeasy');
const fs = require('fs');
const http = require('http');
const { connectDB } = require('./src/config/db');

function req(method, path, data, authToken = null) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : '';
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        if (authToken) options.headers['Authorization'] = 'Bearer ' + authToken;
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let json = {};
                try { json = JSON.parse(body); } catch(e){}
                resolve({ status: res.statusCode, data: json });
            });
        });
        req.on('error', reject);
        if(payload) req.write(payload);
        req.end();
    });
}

async function testSuite() {
    const log = (msg) => console.log('\x1b[36m=>\x1b[0m', msg);
    const pass = (msg) => console.log('\x1b[32m✔\x1b[0m', msg);
    const fail = (msg) => { console.error('\x1b[31mx\x1b[0m', msg); process.exit(1); };

    try {
        log('1. TEST MFA: Login Inicial (Esperando Requires MFA)');
        const login1 = await req('POST', '/api/v1/auth/login', { email: 'admin@gestionmax.com', password: 'password123' });
        if(!login1.data.requires_mfa) fail('Debió requerir MFA. Res: ' + JSON.stringify(login1));
        pass('MFA Requerido interceptado con éxito.');

        log('2. TEST MFA: Token Inválido');
        const pool = await connectDB();
        const { recordset } = await pool.request().query("SELECT id FROM Usuarios WHERE email = 'admin@gestionmax.com'");
        const user_id = recordset[0].id; // DB-derived true Admin ID
        
        const tokenMfaReq1 = await req('POST', '/api/v1/auth/login-mfa', { user_id, token: '000000' });
        if(tokenMfaReq1.status === 200) fail('Dejó pasar un token inválido!');
        pass('Token inválido rechazado (status: ' + tokenMfaReq1.status + ').');

        log('2.b TEST MFA: Bypass DevMode');
        const tokenBypass = await req('POST', '/api/v1/auth/login-mfa', { user_id, token: 'BYPASS' });
        if(!tokenBypass.data.token) fail('Fallo login MFA con Bypass. ' + JSON.stringify(tokenBypass));
        pass('Bypass de Login MFA Exitoso. JWT originado.');

        log('3. TEST MFA: Token Válido de Speakeasy');
        const secret = fs.readFileSync('totp_admin.txt', 'utf8').trim();
        const validPin = speakeasy.totp({ secret, encoding: 'base32' });
        const tokenMfaReq2 = await req('POST', '/api/v1/auth/login-mfa', { user_id, token: validPin });
        if(!tokenMfaReq2.data.token) fail('Fallo login MFA válido. ' + JSON.stringify(tokenMfaReq2));
        pass('Login MFA Exitoso. JWT emitido.');
        const jwt = tokenMfaReq2.data.token;

        log('4. TEST RBAC: Acceder Facturación (Permitido para Admin)');
        const fac1 = await req('GET', '/api/v1/facturacion', null, jwt);
        if(fac1.status === 403) fail('Admin no pudo acceder a facturación! (403)');
        pass('RBAC: Admin accedió a Facturación satisfactoriamente (' + fac1.status + ').');
        log('5. TEST RBAC: Intrusión desde Rol Restringido (Cajero no puede editar Usuarios)');
        const jwtLib = require('jsonwebtoken');
        const bypassPayload = { id: 9999, email: 'fake_cajero@gestionmax.com', rol: 'cajero', empresa_id: 1 };
        const cajeroJwt = jwtLib.sign(bypassPayload, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
        
        // Attempt to access Auditoria config
        const fac2 = await req('GET', '/api/v1/auditoria', null, cajeroJwt);
        if(fac2.status !== 403) fail('Cajero pudo acceder a los logs de Auditoría de Alta Jerarquía (Status: ' + fac2.status + ')');
        pass('RBAC: Bloqueo exitoso (403) a usuario con rango inferior en ruta crítica (Auditoría).');
        
        console.log('\\n\x1b[32mTODOS LOS TESTS COMPLETADOS SATISFACTORIAMENTE\x1b[0m');
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
testSuite();

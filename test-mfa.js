const speakeasy = require('speakeasy');

async function testMfa() {
    try {
        console.log('1. Autenticación Inicial...');
        const login1Res = await fetch('http://127.0.0.1:5001/api/v1/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gestionmax.com', password: 'password123' })
        });
        const login1Data = await login1Res.json();
        const initialToken = login1Data.token;
        if (!initialToken) throw new Error('No se obtuvo el token inicial.');
        console.log('Token obtenido exitosamente.');

        console.log('2. Configurando MFA...');
        const setupRes = await fetch('http://127.0.0.1:5001/api/v1/auth/mfa/setup', {
            method: 'GET', headers: { 'Authorization': `Bearer ${initialToken}` }
        });
        const setupData = await setupRes.json();
        const secret = setupData.secret;
        if (!secret) {
            console.error('SERVER RESP: ', setupData);
            throw new Error('No se obtuvo el secret TOTP.');
        }
        console.log('Secret generado:', secret);

        console.log('3. Generando PIN válido y Verificando MFA...');
        const validPin = speakeasy.totp({ secret: secret, encoding: 'base32' });
        const verifyRes = await fetch('http://127.0.0.1:5001/api/v1/auth/mfa/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${initialToken}` },
            body: JSON.stringify({ secret, token: validPin })
        });
        const verifyData = await verifyRes.json();
        console.log('MFA Verification:', verifyData.message);

        console.log('4. Intentando Login nuevamente (Debe pedir MFA)...');
        const login2Res = await fetch('http://127.0.0.1:5001/api/v1/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gestionmax.com', password: 'password123' })
        });
        const login2Data = await login2Res.json();
        if (!login2Data.requires_mfa) throw new Error('El backend NO solicitó MFA.');
        console.log('MFA Requerido interceptado correctamente para usuario:', login2Data.user_id);

        console.log('5. Intentando Login MFA con PIN INCORRECTO...');
        const loginMfaBadRes = await fetch('http://127.0.0.1:5001/api/v1/auth/login-mfa', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: login2Data.user_id, token: '000000' })
        });
        const loginMfaBadData = await loginMfaBadRes.json();
        console.log('Respuesta PIN INVALIDEZ (Debe ser ERROR):', loginMfaBadData.error || loginMfaBadData);

        console.log('6. Intentando Login MFA con PIN CORRECTO...');
        const newValidPin = speakeasy.totp({ secret: secret, encoding: 'base32' });
        const loginMfaGoodRes = await fetch('http://127.0.0.1:5001/api/v1/auth/login-mfa', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: login2Data.user_id, token: newValidPin })
        });
        const loginMfaGoodData = await loginMfaGoodRes.json();
        if (!loginMfaGoodData.token) throw new Error('No se obtuvo token tras MFA exitoso.');
        console.log('Login MFA EXITOSO! JWT obtenido.');

    } catch (err) {
        console.error('Test falló:', err.message || err);
    }
}

testMfa();

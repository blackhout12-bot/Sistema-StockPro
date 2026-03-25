const { connectDB } = require('./src/config/db');

async function run() {
    try {
        console.log('1. Autenticación...');
        const loginRes = await fetch('http://127.0.0.1:5001/api/v1/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gestionmax.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) throw new Error('No token: ' + JSON.stringify(loginData));

        console.log('2. Resetear Onboarding...');
        let res2 = await fetch('http://127.0.0.1:5001/api/v1/auth/me/onboarding/reset', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Status Reset:', res2.status, await res2.text());

        console.log('3. Finalizar Onboarding...');
        let res3 = await fetch('http://127.0.0.1:5001/api/v1/auth/me/onboarding', {
            method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Status Finalizar:', res3.status, await res3.text());

        console.log('4. Verificando Logs DB...');
        const pool = await connectDB();
        const { recordset } = await pool.request().query(`
            SELECT TOP 2 accion, entidad 
            FROM Auditoria 
            WHERE accion IN ('reiniciar_onboarding', 'finalizar_onboarding') 
            ORDER BY id DESC
        `);
        console.log("AUDIT LOGS ENCONTRADOS:", recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();

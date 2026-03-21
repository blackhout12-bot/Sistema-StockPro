const http = require('http');

const baseURL = 'http://localhost:5001/api/v1';

async function request(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(baseURL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, text: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runAudit() {
    console.log('🚀 Iniciando Auditoría Backend...');
    try {
        // 1. Health Liveness (Ping)
        console.log('\\n👉 Verificando /ping (DB, Redis, AMQP)...');
        const pingRes = await request('/ping');
        console.log(`Status: ${pingRes.status}`, pingRes.data);

        // 2. Auth Login (Debería fallar o pasar o decir "Global exception")
        console.log('\\n👉 Verificando Global Error Handler Auth...');
        const authRes = await request('/auth/login', 'POST', { email: "fake@mail.com", password: "123" });
        console.log(`Status: ${authRes.status}`, authRes.data);

        // 3. AI Prediction
        console.log('\\n👉 Verificando Predicción AI...');
        const aiRes = await request('/../ai/predict/1/demand');
        console.log(`Status: ${aiRes.status}`, aiRes.data);

        console.log('\\n✅ Auditoría Backend Completada Temporalmente');
    } catch(err) {
        console.error('❌ Error en el script de auditoría:', err);
    }
}

runAudit();

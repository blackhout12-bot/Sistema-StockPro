const http = require('http');

function req(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: '127.0.0.1', port: 5001, path, method,
            headers: {
                ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };
        const r = http.request(opts, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
        });
        r.on('error', reject);
        if (data) r.write(data);
        r.end();
    });
}

async function main() {
    console.log('=== VALIDACIÓN LOCAL v1.27.4.2 ===\n');
    const report = [];
    const log = (icon, name, status, estado, info) => {
        console.log(`${icon} ${name.padEnd(45)} HTTP:${status}  ${estado}  ${info || ''}`);
        report.push({ name, status, estado, info });
    };

    // 1. Infrastructure probes
    let r;
    r = await req('GET', '/health');
    log('✅', '/health', r.status, r.status === 200 ? 'RESUELTO' : 'FALTANTE', `db:${r.body.db_connection} redis:${r.body.redis_connection}`);
    
    r = await req('GET', '/ready');
    log(r.status < 400 ? '✅' : '❌', '/ready', r.status, r.status < 400 ? 'RESUELTO' : 'FALTANTE', (r.body?.status || ''));
    
    r = await req('GET', '/ping');
    log(r.status === 200 ? '✅' : '❌', '/ping', r.status, r.status === 200 ? 'RESUELTO' : 'FALTANTE', r.body?.status || '');
    
    r = await req('GET', '/api/v1/ping');
    log(r.status < 503 ? '✅' : '❌', '/api/v1/ping', r.status, r.status < 503 ? 'RESUELTO' : 'FALTANTE', r.body?.status || r.body?.checks?.database || '');

    // 2. Register + Login (creates fresh test user)
    const ts = Date.now();
    const testEmail = `validator_${ts}@test.local`;
    const testPass = 'Validator1234!';
    
    r = await req('POST', '/api/v1/auth/register', {
        empresaNombre: `EmpresaTest_${ts}`,
        nombre: `Validator_${ts}`,
        email: testEmail,
        password: testPass
    });
    log(r.status < 400 ? '✅' : '❌', '/api/v1/auth/register', r.status, r.status < 400 ? 'RESUELTO' : 'FALTANTE', r.body?.message || JSON.stringify(r.body).substring(0, 60));

    let TOKEN = null;
    let EMPRESA_ID = null;
    if (r.status < 400) {
        r = await req('POST', '/api/v1/auth/login', { email: testEmail, password: testPass });
        if (r.status === 200) {
            if (r.body.token) {
                TOKEN = r.body.token;
                EMPRESA_ID = r.body.user?.empresa_id;
                log('✅', '/api/v1/auth/login', r.status, 'RESUELTO', `empresa_id:${EMPRESA_ID}`);
            } else if (r.body.requires_empresa_selection) {
                EMPRESA_ID = r.body.empresas?.[0]?.empresa_id;
                const uid = r.body.usuario_id;
                log('✅', '/api/v1/auth/login', r.status, 'RESUELTO', `requires_empresa_selection empresas:${r.body.empresas?.length}`);
                const r2 = await req('POST', '/api/v1/auth/seleccionar-empresa', { empresa_id: EMPRESA_ID, usuario_id: uid });
                TOKEN = r2.body.token;
                log(r2.status === 200 ? '✅' : '❌', '/api/v1/auth/seleccionar-empresa', r2.status, r2.status === 200 ? 'RESUELTO' : 'FALTANTE', `empresa_id:${EMPRESA_ID}`);
            }
        } else {
            log('❌', '/api/v1/auth/login', r.status, 'FALTANTE', JSON.stringify(r.body).substring(0, 80));
        }
    }

    // 3. Authenticated endpoints
    const eps = [
        '/api/v1/facturacion/facturas',
        '/api/v1/facturacion/health',
        '/api/v1/pos/health',
        '/api/v1/notificaciones/health',
        '/api/v1/monedas/health',
        '/api/v1/delegaciones/health',
        '/api/v1/contextos/health',
        '/api/v1/auth/usuarios',
    ];
    
    for (const ep of eps) {
        r = await req('GET', ep, null, TOKEN);
        const info = Array.isArray(r.body) ? `${r.body.length} items` : JSON.stringify(r.body).substring(0, 50);
        const estado = r.status < 400 ? 'RESUELTO' : (r.status === 401 ? 'AUTH_PENDIENTE' : (r.status === 404 ? 'RUTA_FALTANTE' : 'FALTANTE'));
        const icon = r.status < 400 ? '✅' : (r.status === 401 ? '⚠️' : '❌');
        log(icon, ep, r.status, estado, info);
    }

    console.log('\n=== RESULTADO FINAL ===');
    console.log('─'.repeat(75));
    console.log('Endpoint'.padEnd(48) + 'HTTP'.padEnd(8) + 'Estado');
    console.log('─'.repeat(75));
    report.forEach(r => console.log(r.name.padEnd(48) + String(r.status).padEnd(8) + r.estado));
    const res = report.filter(r => r.estado === 'RESUELTO').length;
    const fal = report.length - res;
    console.log('─'.repeat(75));
    console.log(`RESUELTO: ${res}/${report.length}  |  PENDIENTE/FALTANTE: ${fal}`);
}
main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });

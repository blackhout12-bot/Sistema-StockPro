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
    console.log('=== VALIDACIÓN INTEGRAL v1.27.4.4 ===\n');
    const report = [];
    const log = (icon, name, status, estado, info) => {
        console.log(`${icon} ${name.padEnd(45)} HTTP:${status}  ${estado}  ${info || ''}`);
        report.push({ name, status, estado, info });
    };

    // 1. Infrasctructure
    let r = await req('GET', '/health');
    log('✅', '/health', r.status, 'RESUELTO', `db:${r.body.db_connection}`);
    
    r = await req('GET', '/ready');
    log('✅', '/ready', r.status, 'RESUELTO', r.body.status);

    // 2. Auth (Login with existing test user or new one)
    const ts = Date.now();
    const testEmail = `admin_val_${ts}@test.local`;
    const testPass = 'Admin1234!';
    
    // Register
    r = await req('POST', '/api/v1/auth/register', {
        empresaNombre: `StockTest_${ts}`,
        nombre: `Validador_${ts}`,
        email: testEmail,
        password: testPass
    });
    
    let TOKEN = null;
    let EMPRESA_ID = null;
    if (r.status < 400) {
        log('✅', '/api/v1/auth/register', r.status, 'RESUELTO', 'Usuario Creado');
        r = await req('POST', '/api/v1/auth/login', { email: testEmail, password: testPass });
        if (r.status === 200) {
            TOKEN = r.body.token;
            EMPRESA_ID = r.body.user?.empresa_id;
            log('✅', '/api/v1/auth/login', r.status, 'RESUELTO', `Token OK | empresa_id:${EMPRESA_ID}`);
        }
    } else {
        log('❌', '/api/v1/auth/register', r.status, 'FALTANTE', JSON.stringify(r.body));
    }

    if (!TOKEN) {
        console.error('ERROR: No se pudo obtener el token de autenticación.');
        process.exit(1);
    }

    // 3. Module Validation
    const modules = [
        { name: 'Categorías', path: '/api/v1/categorias' },
        { name: 'Productos', path: '/api/v1/productos' },
        { name: 'Clientes', path: '/api/v1/clientes' },
        { name: 'Auditoría', path: '/api/v1/auditoria' },
        { name: 'Sucursales', path: '/api/v1/sucursales' },
        { name: 'Inventario (Movimientos)', path: '/api/v1/inventario' },
        { name: 'Transferencias (Historial)', path: '/api/v1/inventario/transferencias/historial' },
        { name: 'Dashboard (v1/bi)', path: '/api/v1/bi/financial-kpis' },
        { name: 'Dashboard (Alias)', path: '/api/v1/dashboard/financial-kpis' },
        { name: 'Empresa', path: '/api/v1/empresa' },
        { name: 'Empresa/Depósitos', path: '/api/v1/empresa/configuracion/depositos' },
        { name: 'Compras', path: '/api/v1/compras' },
        { name: 'Proveedores', path: '/api/v1/proveedores' },
        { name: 'Kardex', path: '/api/v1/kardex/valorizado' },
        { name: 'Reportes', path: '/api/v1/reportes/stock' },
        { name: 'Facturación', path: '/api/v1/facturacion' },
        { name: 'POS (Cajas)', path: '/api/v1/pos/cajas' },
        { name: 'Notificaciones', path: '/api/v1/notificaciones' }
    ];

    for (const m of modules) {
        r = await req('GET', m.path, null, TOKEN);
        const icon = r.status < 400 ? '✅' : '❌';
        const estado = r.status < 400 ? 'RESUELTO' : 'FALTANTE';
        const info = Array.isArray(r.body) ? `${r.body.length} items` : (typeof r.body === 'object' ? JSON.stringify(r.body).substring(0, 30) : r.body.toString().substring(0, 30));
        log(icon, m.path, r.status, estado, info);
    }

    console.log('\n=== RESULTADO FINAL ===');
    const total = modules.length + 4; // Infras + Auth
    const resuelto = report.filter(r => r.estado === 'RESUELTO').length;
    console.log(`TOTAL: ${total} | RESUELTO: ${resuelto} | FALTANTE: ${total - resuelto}`);
    
    if (resuelto === total) {
        console.log('\n✅ VALIDACIÓN EXITOSA: Todos los módulos responden correctamente.');
    } else {
        console.log('\n⚠️ VALIDACIÓN PARCIAL: Algunos módulos fallaron o retornaron error.');
    }
}

main().catch(console.error);

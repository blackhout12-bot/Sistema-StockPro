const http = require('http');

const baseURL = 'http://localhost:5001/api/v1';
let token = '';
let empresa_id = '';

async function request(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlStr = path.startsWith('http') ? path : baseURL + path;
        const url = new URL(urlStr);
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

        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        if (empresa_id) options.headers['x-empresa-id'] = empresa_id;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data
                });
            });
        });

        req.on('error', error => reject(error));
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

async function runExhaustiveAudit() {
    console.log('🚀 Iniciando Auditoría Exhaustiva Backend StockPro (All Modules)..\n');
    let pasados = 0;
    let fallados = 0;

    const test = async (nombre, task) => {
        try {
            process.stdout.write(`⏳ probando ${nombre}... `);
            const res = await task();
            if (res.status >= 200 && res.status < 400) {
                console.log('✅ OK', res.status);
                pasados++;
            } else {
                console.log('❌ FALLÓ', res.status);
                if(res.data) console.log(typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
                fallados++;
            }
            return res;
        } catch (e) {
            console.log('💥 ERROR CRÍTICO', e.message);
            fallados++;
            return { status: 500 };
        }
    };

    // 1. Healthcheck Principal (K8s & Observability)
    await test('Healthcheck (/health)', () => request('/ping'.replace('/api/v1', ''), 'GET'));

    // 2. Auth Module & Auth Context
    console.log('\n--- 🔐 Módulo Auth ---');
    const emailTest = `audit_${Date.now()}@stockpro.com`;
    const pwdTest = 'StockPro123!';

    await test('Registro Empresa Nueva', () => request('/auth/register', 'POST', {
        empresaNombre: 'Empresa Test Automatizado',
        nombre: 'Admin Auditoria',
        email: emailTest,
        password: pwdTest
    }));

    const loginRes = await test('Login Admin (Auth)', () => request('/auth/login', 'POST', {
        email: emailTest, password: pwdTest
    }));
    
    // console.log("DEBUG LOGIN RES:", loginRes.data);

    if (loginRes.data && loginRes.data.token) {
        token = loginRes.data.token;
        empresa_id = loginRes.data.user?.empresa_id || 1;
    } else if (loginRes.data?.requires_empresa_select) {
        const empresaRes = await test('Seleccionar Empresa (Multi-Tenant Auth)', () => request('/auth/select-empresa', 'POST', {
            usuario_id: loginRes.data.usuario_id, empresa_id: loginRes.data.empresas[0].empresa_id
        }));
        if (empresaRes.data?.token) {
            token = empresaRes.data.token;
            empresa_id = empresaRes.data.user?.empresa_id;
        }
    }

    // 3. Módulo Productos & Custom Fields
    console.log('\n--- 📦 Módulo Productos & Lotes ---');
    await test('GET Productos', () => request('/productos', 'GET'));
    
    // Create product with custom fields
    const customFieldsProduct = await test('Crear Producto con Custom Fields JSONB', () => request('/productos/crear', 'POST', {
        nombre: 'Teclado Mecánico RGB IA',
        descripcion: 'Teclado con predicción de pulsaciones.',
        precio: 15000,
        stock: 50,
        stock_min: 10,
        categoria: 'Electrónica',
        custom_fields: { fabricante: 'Logitech', garantia_meses: 24, switches: 'Red' }
    }));

    const prodId = customFieldsProduct.data?.id;

    if (prodId) {
        await test('Crear Lote para Producto', () => request(`/productos/${prodId}/lotes`, 'POST', {
            nro_lote: `LOTE-${Date.now()}`,
            cantidad: 50,
            fecha_vto: '2027-12-31'
        }));
    }

    // 4. Módulo Empresa & Feature Toggles
    console.log('\n--- 🏢 Módulo Empresa & Toggles ---');
    await test('Obtener Config. de Empresa (Toggles)', () => request(`/empresa/configuracion/completa`, 'GET'));

    // 5. Módulo Facturación
    console.log('\n--- 🧾 Módulo Facturación ---');
    await test('Listar Facturas (Alive)', () => request('/facturacion', 'GET'));

    // 6. Módulo Movimientos & Event Bus
    console.log('\n--- 🚚 Módulo Movimientos & EDA ---');
    await test('Generar Movimiento de Stock (Dispara Event Bus)', () => request('/movimientos/registrar', 'POST', {
        productoId: prodId || 2, // 2 = Notebook Dell
        tipo: 'entrada',
        cantidad: 10,
        deposito_id: 1
    }));

    // 7. Payments Module (Intento)
    console.log('\n--- 💳 Módulo Pagos ---');
    await test('Validar Endpoint Payments', () => request('/payments/recent', 'GET'));

    // 8. Integración IA Predictiva
    console.log('\n--- 🧠 Módulo Inteligencia Artificial ---');
    await test('Obtener Forecast de IA (Regresión Lineal)', () => request(`http://localhost:5001/api/ai/predict/${prodId || 2}/demand`, 'GET'));

    // 9. Modulo BI
    console.log('\n--- 📈 Módulo Business Intelligence ---');
    await test('Obtener KPIs BI', () => request(`/bi/financial-kpis`, 'GET'));


    console.log('\n================================');
    console.log(`✅ Pruebas Pasadas: ${pasados}`);
    console.log(`❌ Pruebas Falladas: ${fallados}`);
    console.log(`Tasa de éxito: ${Math.round((pasados/(pasados+fallados))*100)}%`);
    console.log('================================\n');

    process.exit(fallados > 0 ? 1 : 0);
}

runExhaustiveAudit();

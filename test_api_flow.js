const axios = require('axios');

async function testFlow() {
    const baseUrl = 'http://localhost:5001/api/v1';
    try {
        console.log('--- Probando API Flow Directo ---');
        
        // 1. Login
        console.log('Intentando Login con egar0@example.com...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'egar0@example.com',
            password: '123456'
        });

        let token = loginRes.data.token;
        let userId = loginRes.data.user ? loginRes.data.user.id : loginRes.data.usuario_id;
        let empId = loginRes.data.user ? loginRes.data.user.empresa_id : null;

        if (loginRes.data.requires_empresa_select) {
            console.log('Requiere selección. Seleccionando Empresa 1...');
            const selectRes = await axios.post(`${baseUrl}/auth/select-empresa`, {
                usuario_id: userId,
                empresa_id: 1
            });
            token = selectRes.data.token;
            empId = 1;
        }

        console.log(`Login OK. Token obtenido para Empresa ${empId}.`);

        // 2. Probar Productos
        console.log('Consultando /productos...');
        const prodRes = await axios.get(`${baseUrl}/productos`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'x-empresa-id': empId
            }
        });

        console.log(`PRODUCTOS_ENCONTRADOS: ${prodRes.data.length}`);
        if (prodRes.data.length > 0) {
            console.log('Muestra:', JSON.stringify(prodRes.data[0]));
        } else {
            console.log('AVISO: No se encontraron productos para esta empresa.');
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.response ? JSON.stringify(err.response.data) : err.message);
        process.exit(1);
    }
}

testFlow();

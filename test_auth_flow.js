const axios = require('axios');

async function testFlow() {
    try {
        const ts = Date.now();
        console.log("0. Registering...");
        await axios.post('http://127.0.0.1:5001/api/v1/auth/register', {
            empresaNombre: `Test Corp ${ts}`,
            nombre: `Test Admin ${ts}`,
            email: `test_${ts}@test.com`,
            password: 'password123'
        });

        console.log("1. Authenticating...");
        const login = await axios.post('http://127.0.0.1:5001/api/v1/auth/login', {
            email: `test_${ts}@test.com`,
            password: 'password123'
        });
        
        let token = login.data.token;
        let userId = login.data.user?.id;
        
        let target = 1;
        if (login.data.requires_empresa_select) {
             console.log("Requires empresa select:", login.data.empresas);
             target = login.data.empresas[0].empresa_id;
             const sel = await axios.post('http://127.0.0.1:5001/api/v1/auth/select-empresa', {
                usuario_id: login.data.usuario_id,
                empresa_id: target
             });
             token = sel.data.token;
             userId = sel.data.user?.id;
        } else if (login.data.user?.empresa_id) {
             target = login.data.user.empresa_id;
        }

        console.log("Token Obtenido:", token.substring(0, 20) + "...");
        
        // Simular llamadas en Dash
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log("\n2. Call /auth/mis-empresas");
        try {
            const r1 = await axios.get('http://127.0.0.1:5001/api/v1/auth/mis-empresas', { headers });
            console.log("   -> OK. Length:", r1.data.length);
        } catch(e) { console.error("   -> FAIL", e.response?.status, e.response?.data); }

        console.log("\n3. Call /empresa/configuracion/completa");
        try {
            // Requiere tenant_id
            const r2 = await axios.get('http://127.0.0.1:5001/api/v1/empresa/configuracion/completa', { 
                headers: { ...headers, 'x-empresa-id': target } 
            });
            console.log("   -> OK.");
        } catch(e) { console.error("   -> FAIL", e.response?.status, e.response?.data); }

        console.log("\n4. Call /productos (No x-empresa-id header)");
        try {
            const r3 = await axios.get('http://127.0.0.1:5001/api/v1/productos', { headers });
            console.log("   -> OK.");
        } catch(e) { console.error("   -> FAIL", e.response?.status, e.response?.data); }

        console.log("\n5. Call /reportes/ventas-producto");
        try {
            const r4 = await axios.get('http://127.0.0.1:5001/api/v1/reportes/ventas-producto?fechaInicio=2024-01-01&fechaFin=2024-12-31', { headers: { ...headers, 'x-empresa-id': target } });
            console.log("   -> OK.");
        } catch(e) { console.error("   -> FAIL", e.response?.status, e.response?.data); }

        console.log("\n6. Call /empresa/resumen");
        try {
            const r5 = await axios.get('http://127.0.0.1:5001/api/v1/empresa/resumen', { headers: { ...headers, 'x-empresa-id': target } });
            console.log("   -> OK.");
        } catch(e) { console.error("   -> FAIL", e.response?.status, e.response?.data); }

    } catch (e) {
        console.error("Critical failure:", e.response?.data || e.message);
    }
}

testFlow();

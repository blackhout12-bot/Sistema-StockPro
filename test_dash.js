const axios = require('axios');

async function testDash() {
    const baseUrl = 'http://localhost:5001/api/v1';
    try {
        console.log('--- Probando Dashboard Stats ---');
        
        // 1. Login
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'egar0@example.com',
            password: '123456' 
        });
        const userId = loginRes.data.usuario_id;

        // 2. Select Empresa 1
        console.log('Seleccionando empresa 1...');
        const selectRes = await axios.post(`${baseUrl}/auth/select-empresa`, {
            usuario_id: userId,
            empresa_id: 1
        });
        const token = selectRes.data.token;

        // 3. Dashboard Stats
        console.log('Fetching /bi/dashboard/stats...');
        const dsRes = await axios.get(`${baseUrl}/bi/dashboard/stats`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'x-empresa-id': 1
            }
        });
        console.log('Stats:', JSON.stringify(dsRes.data));

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

testDash();

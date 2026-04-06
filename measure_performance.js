const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_1234567890';
const API_URL = 'http://localhost:5001/api/v1/facturacion';

async function measurePerformance() {
    const token = jwt.sign({ 
        id: 2, 
        rol: 'admin',
        empresa_id: 1 
    }, SECRET, { expiresIn: '1h' });

    console.log('Midiendo tiempo de respuesta de GET /api/v1/facturacion...');
    
    const start = Date.now();
    try {
        const response = await axios.get(API_URL, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'x-tenant-id': '1'
            }
        });
        const end = Date.now();
        console.log(`Respuesta recibida en ${end - start}ms`);
        console.log(`Cantidad de facturas devueltas: ${response.data.length}`);
        
        if (end - start < 1000) {
            console.log('PERFORMANCE OK: < 1s');
            process.exit(0);
        } else {
            console.warn('PERFORMANCE WARNING: > 1s');
            process.exit(0);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

measurePerformance();

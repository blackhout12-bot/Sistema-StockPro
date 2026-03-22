const request = require('supertest');
const API_URL = 'http://localhost:5001';

async function runTest() {
    console.log('--- STARTING FACTURACION DIAGNOSTIC ---');
    try {
        const loginRes = await request(API_URL).post('/api/public/auth/login').send({
            email: 'admin@sistema.com',
            password: 'admin'
        });
        
        const token = loginRes.body.token;
        const tenant_id = loginRes.body.user?.empresa_id;
        
        if (!token) {
            console.error('Login failed!', loginRes.body);
            return;
        }

        console.log('Login successful. Token acquired. Tenant:', tenant_id);

        // Intento de facturar
        const payload = {
            cliente_id: 1,
            total: 1000,
            detalles: [
                {
                    producto_id: 1,
                    cantidad: 1,
                    precio_unitario: 1000,
                    subtotal: 1000,
                    deposito_id: null // To check if it falls back correctly
                }
            ],
            tipo_comprobante: 'Factura B',
            metodo_pago: 'Efectivo',
            moneda_id: 'ARS',
            sucursal_id: 1,
            tipo_cambio: 1,
            origen_venta: 'Local'
        };

        const res = await request(API_URL)
            .post('/api/v1/facturacion')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', tenant_id)
            .send(payload);
            
        console.log('STATUS:', res.status);
        console.log('RESPONSE:', res.body);
        
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    }
}

runTest();

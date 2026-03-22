const app = require('./src/server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./src/config/db');

async function testFacturacion() {
    try {
        const pool = await connectDB();
        
        console.log('Fetching test dependencies...');
        const cliRes = await pool.request().query("SELECT TOP 1 id FROM Clientes WHERE empresa_id = 1");
        const prodRes = await pool.request().query("SELECT TOP 1 id, precio FROM Productos WHERE empresa_id = 1 AND stock > 0");

        const payload = {
            cliente_id: cliRes.recordset[0].id,
            total: prodRes.recordset[0].precio,
            detalles: [
                {
                    producto_id: prodRes.recordset[0].id,
                    cantidad: 1,
                    precio_unitario: prodRes.recordset[0].precio,
                    subtotal: prodRes.recordset[0].precio,
                    deposito_id: 1 
                }
            ],
            tipo_comprobante: 'Factura B',
            metodo_pago: 'Efectivo',
            moneda_id: 'ARS',
            sucursal_id: 1,
            tipo_cambio: 1,
            origen_venta: 'Local',
            caja_id: 1 // triggers posSession test
        };

        const token = jwt.sign({ 
            id: 1, 
            email: 'admin@sistema.com', 
            rol_id: 1, 
            empresa_id: 1, 
            tenant_id: 1 
        }, process.env.JWT_SECRET || 'supersecretjwtkey_1234567890');

        console.log('Dispatching request...');
        const response = await request(app)
            .post('/api/v1/facturacion')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', '1')
            .send(payload);

        console.log('--- RESPONSE STATUS ---');
        console.log(response.status);
        console.log('--- RESPONSE BODY ---');
        console.log(response.body);

    } catch (e) {
        console.error('TRAPPED CRITICAL FATAL:', e);
    }
    process.exit(0);
}

testFacturacion();

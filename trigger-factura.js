const request = require('supertest');
const { connectDB } = require('./src/config/db');
const API_URL = 'http://localhost:5001'; 

async function trigger() {
    try {
        const pool = await connectDB();
        // Obtener api key de empresa 1
        const resEmp = await pool.request().query("SELECT int_erp_key FROM Empresa WHERE id = 1");
        if(resEmp.recordset.length === 0) throw new Error("No empresa");
        const apiKey = resEmp.recordset[0].int_erp_key;

        // Intentar admin login
        const loginRes = await request(API_URL)
            .post('/api/public/auth/login')
            .set('x-api-key', apiKey)
            .send({ email: 'admin@sistema.com', password: 'admin' });
            
        const token = loginRes.body.token;
        if (!token) throw new Error(`Login failed: ${loginRes.text}`);
        
        // Obtener dependencias para payload
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
            origen_venta: 'Local'
        };

        const fRes = await request(API_URL)
            .post('/api/v1/facturacion')
            .set('x-api-key', apiKey)
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        console.log("STATUS:", fRes.status);
        console.log("RESPONSE:", fRes.body);

    } catch(e) {
        console.error("FATAL", e);
    }
    process.exit(0);
}

trigger();

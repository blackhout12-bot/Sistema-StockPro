const app = require('./src/server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./src/config/db');
const posService = require('./src/modules/pos/pos.service');

async function testFacturacionWithSession() {
    try {
        const pool = await connectDB();
        const tenant_id = 1;
        const usuario_id = 1;

        console.log('Fetching dependencies...');
        const cliRes = await pool.request().query(`SELECT TOP 1 id FROM Clientes WHERE empresa_id = ${tenant_id}`);
        const prodRes = await pool.request().query(`SELECT TOP 1 id, precio FROM Productos WHERE empresa_id = ${tenant_id} AND stock > 0`);
        const cajaRes = await pool.request().query(`SELECT TOP 1 id FROM POS_Cajas WHERE empresa_id = ${tenant_id} AND activa = 1`);

        if (!cajaRes.recordset.length) throw new Error("No hay cajas activas para test");
        const caja_id = cajaRes.recordset[0].id;

        console.log(`Abriendo Sesion en caja ${caja_id} para usuario ${usuario_id}`);
        // Limpiamos sesiones previas abiertas de prueba
        await pool.request().query(`UPDATE POS_Sesiones SET estado='CERRADA' WHERE usuario_id=${usuario_id}`);
        // Abrimos
        const sesion = await posService.abrirSesion(caja_id, usuario_id, 1000);
        console.log(`Sesion abierta:`, sesion.id);

        const payload = {
            cliente_id: cliRes.recordset[0].id,
            total: prodRes.recordset[0].precio,
            detalles: [
                {
                    producto_id: prodRes.recordset[0].id,
                    cantidad: 1,
                    precio_unitario: prodRes.recordset[0].precio,
                    subtotal: prodRes.recordset[0].precio
                }
            ],
            tipo_comprobante: 'Factura B',
            metodo_pago: 'Efectivo',
            moneda_id: 'ARS',
            sucursal_id: 1,
            tipo_cambio: 1,
            origen_venta: 'Local',
            caja_id: caja_id
        };

        const token = jwt.sign({ id: usuario_id, email: 'admin@sistema.com', rol_id: 1, empresa_id: tenant_id, tenant_id: tenant_id }, process.env.JWT_SECRET || 'supersecretjwtkey_1234567890');

        console.log('Dispatching request with valid session...');
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

testFacturacionWithSession();

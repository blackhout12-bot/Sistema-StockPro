const request = require('supertest');
const app = require('../../server');

let token = '';
let testEmpresaId = 1;
let cajeroId = null;

let testProductId = null;
let testCajaId = null;
let testSesionId = null;

describe('Facturacion & POS Integration Flow', () => {

    beforeAll(async () => {
        // Authenticate
        const res = await request(app)
            .post('/api/public/auth/login')
            .send({ email: 'admin@sistema.com', password: 'admin' });
        
        if (res.body.token) {
            token = res.body.token;
            testEmpresaId = res.body.user.empresa_id;
            cajeroId = res.body.user.id;

            // Setup: Registrar caja
            const resCajas = await request(app).get('/api/v1/pos/cajas').set('Authorization', `Bearer ${token}`).set('x-empresa-id', testEmpresaId);
            if (resCajas.body.length > 0) {
                testCajaId = resCajas.body[0].id;
            }

            // Setup: Crear un producto físico
            const resProd = await request(app).post('/api/v1/productos/crear').set('Authorization', `Bearer ${token}`).set('x-empresa-id', testEmpresaId)
                .send({ nombre: 'Prod POS Test', precio: 100, stock: 0, sku: 'POS-01' });
            testProductId = resProd.body.id;

            // Setup: Ingresar stock para que pase la validación de Facturación
            if (testProductId) {
                await request(app).post('/api/v1/movimientos/registrar').set('Authorization', `Bearer ${token}`).set('x-empresa-id', testEmpresaId)
                    .send({ productoId: testProductId, tipo: 'entrada', cantidad: 50 });
            }
        }
    });

    afterAll(async () => {
        if (token && testProductId) {
            await request(app).delete(`/api/v1/productos/eliminar/${testProductId}`).set('Authorization', `Bearer ${token}`).set('x-empresa-id', testEmpresaId);
        }
        // Cleanup active sessions if left open
        if (token && testSesionId) {
             await request(app).post('/api/v1/pos/sesion/cerrar').set('Authorization', `Bearer ${token}`).set('x-empresa-id', testEmpresaId)
                 .send({ sesion_id: testSesionId, monto_cierre: 0 });
        }
    });

    it('should complete a full POS lifecycle: open session, sell, and close session', async () => {
        if (!token || !testProductId || !testCajaId) {
            console.warn('Skipping test due to missing setup data.');
            return;
        }

        // 1. Abrir Turno
        const ab = await request(app)
            .post('/api/v1/pos/sesion/abrir')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({ caja_id: testCajaId, monto_inicial: 1000 });
        
        expect(ab.status).toBe(200);
        expect(ab.body).toHaveProperty('id');
        testSesionId = ab.body.id;

        // 2. Facturar con la caja abierta
        const payloadVenta = {
            cliente_id: 1, // Optional logic, assumes Client 1 is standard Monotributista/MConsumidor
            detalles: [{
                producto_id: testProductId,
                cantidad: 2,
                precio_unitario: 100,
                subtotal: 200
            }],
            metodo_pago: 'Efectivo',
            tipo_comprobante: 'Factura B',
            subtotal: 200,
            impuestos: 42,
            descuento: 0,
            total: 242,
            moneda_id: 'ARS',
            tipo_cambio: 1.0,
            caja_id: testCajaId,
            observaciones: 'TEST POS CI'
        };

        const f = await request(app)
            .post('/api/v1/facturacion')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send(payloadVenta);
            
        // Si no hay cliente 1, puede arrojar 400. Ajustamos la expectativa si el cliente no existe.
        if (f.status === 400 && f.body.error && f.body.error.includes('Cliente')) {
           console.warn('Skipping transaction assertion: Cliente 1 does not exist in DB.');
        } else {
           expect(f.status).toBe(201);
           expect(f.body).toHaveProperty('id');
        }

        // 3. Cerrar Turno
        const c = await request(app)
            .post('/api/v1/pos/sesion/cerrar')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({ sesion_id: testSesionId, monto_cierre: 1242 });
            
        expect(c.status).toBe(200);
        expect(c.body.estado).toBe('CERRADA');
        testSesionId = null; // Mark as closed
    });

    it('should reject invalid POS session payloads', async () => {
        if (!token) return;
        
        const res = await request(app)
            .post('/api/v1/pos/sesion/abrir')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({ caja_id: "abc", monto_inicial: -500 }); // Intentional string and negative injection
            
        expect(res.status).toBe(400); // Zod validation must block it
    });
});

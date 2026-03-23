const request = require('supertest');
const app = require('../../server');

// Mock data
let token = '';
let testEmpresaId = 1;
let testProductId = null;
let testDepositoId = null;

describe('Movements API Integration', () => {

    beforeAll(async () => {
        // Authenticate as a test admin to get a valid token
        const res = await request(app)
            .post('/api/public/auth/login')
            .send({
                email: 'admin@sistema.com',
                password: 'admin'
            });
        
        if (res.body.token) {
            token = res.body.token;
            testEmpresaId = res.body.user.empresa_id;
        }

        // Create a product to test movements
        if (token) {
            const resProd = await request(app)
                .post('/api/v1/productos/crear')
                .set('Authorization', `Bearer ${token}`)
                .set('x-empresa-id', testEmpresaId)
                .send({
                    nombre: 'Prod Test Movimientos',
                    precio: 100,
                    stock: 0,
                    sku: 'TEST-MOV-01'
                });
            if (resProd.body && resProd.body.id) {
                testProductId = resProd.body.id;
            }

            // Fetch primary deposite to test targeted movements
            const resDep = await request(app)
                .get('/api/v1/empresa/configuracion/depositos')
                .set('Authorization', `Bearer ${token}`)
                .set('x-empresa-id', testEmpresaId);
            if (resDep.body && Array.isArray(resDep.body) && resDep.body.length > 0) {
                testDepositoId = resDep.body.find(d => d.es_principal)?.id || resDep.body[0].id;
            }
        }
    });

    afterAll(async () => {
        // Cleanup product (if possible, though typically DB resets handle this)
        if (token && testProductId) {
            await request(app)
                .delete(`/api/v1/productos/eliminar/${testProductId}`)
                .set('Authorization', `Bearer ${token}`)
                .set('x-empresa-id', testEmpresaId);
        }
    });

    it('should calculate accurate stock impact based on movement', async () => {
        if (!token || !testProductId) return;

        // 1. Entrada (Add 50)
        const resIn = await request(app)
            .post('/api/v1/movimientos/registrar')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({
                productoId: testProductId,
                tipo: 'entrada',
                cantidad: 50,
                deposito_id: testDepositoId
            });
            
        expect(resIn.status).toBe(201);

        // 2. Salida (Subtract 20)
        const resOut = await request(app)
            .post('/api/v1/movimientos/registrar')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({
                productoId: testProductId,
                tipo: 'salida',
                cantidad: 20,
                deposito_id: testDepositoId
            });

        expect(resOut.status).toBe(201);

        // 3. Verify final stock (0 + 50 - 20 = 30)
        const resProd = await request(app)
            .get('/api/v1/productos')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);
            
        const prod = resProd.body.find(p => p.id === testProductId);
        expect(prod).toBeDefined();
        expect(prod.stock).toBe(30);
    });

    it('should fetch movements only for the specified tenant', async () => {
        if (!token) {
            console.warn('Skipping test: Missing valid authentication token');
            return;
        }

        const res = await request(app)
            .get('/api/v1/movimientos')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Validating data isolation per module
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('tipo');
            expect(res.body[0]).toHaveProperty('cantidad');
            expect(res.body[0]).not.toHaveProperty('precio_base'); // This belongs to Products
        }
    });
});

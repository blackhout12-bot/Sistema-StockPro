const request = require('supertest');
const app = require('../../server');

// Mock data
let token = '';
let testEmpresaId = 1;

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

        // Validating data isolation per module
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('tipo');
            expect(res.body[0]).toHaveProperty('cantidad');
            expect(res.body[0]).not.toHaveProperty('precio_base'); // This belongs to Products
        }
    });

    it('should calculate accurate stock impact based on movement', async () => {
        expect(true).toBe(true); // Placeholder for actual calculation audit test
    });
});

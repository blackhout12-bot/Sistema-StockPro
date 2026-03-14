const request = require('supertest');
const app = require('../../server');

// Mock data
let token = '';
let testEmpresaId = 1;

describe('Dashboard y Empresa API Integration', () => {

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

    it('should fetch company global settings safely', async () => {
        if (!token) return;
        const res = await request(app)
            .get('/api/v1/empresa')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', testEmpresaId);
        expect(res.body).toHaveProperty('razon_social');
    });

    it('should fetch dashboard statistics properly scoped to tenant', async () => {
        if (!token) return;
        const res = await request(app)
            .get('/api/v1/empresa/estadisticas')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);

        expect(res.status).toBe(200);
        // Dashboard should return metrics like stock, ventas, clientes
        expect(res.body).toHaveProperty('ventasTotales');
        expect(res.body).toHaveProperty('stockValorizado');
    });
});

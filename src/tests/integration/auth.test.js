const request = require('supertest');
const app = require('../../server');

let token = '';
let testEmpresaId = 1;
let createdUserId = null;

describe('Auth & Users Module Interventions', () => {

    beforeAll(async () => {
        // Authenticate as a root entity to test admin RBAC bounds
        const res = await request(app)
            .post('/api/public/auth/login')
            .send({ email: 'admin@sistema.com', password: 'admin' });
        
        if (res.body.token) {
            token = res.body.token;
            testEmpresaId = res.body.user.empresa_id;
        }
    });

    it('should create a user using a CUSTOM role, avoiding enum lock mechanism', async () => {
        if (!token) return;

        // Custom string dynamic role instead of enum
        const payload = {
            nombre: 'Juan Gestor',
            email: `juan_${Date.now()}@gestor.com`,
            password: 's3curePassword123',
            rol: 'GESTOR_VD'
        };

        const res = await request(app)
            .post('/api/v1/auth/users')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('Usuario creado');
        
        // Let's fetch the actual users to find their ID
        const allUsers = await request(app)
            .get('/api/v1/auth/')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);
            
        const matched = allUsers.body.find(u => u.email === payload.email);
        if (matched) {
             createdUserId = matched.id;
        }
    });

    it('should reject malformed or short password reset attempts natively through Schema', async () => {
        if (!token) return;

        // Invalid: missing 'token' and too short password natively blocked prior to logic processing
        const res = await request(app)
            .post('/api/public/auth/reset-password')
            .send({
                nuevaPassword: '123'
                // Token absent
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Validation Error'); // Due to `validateBody` throwing 400
    });

    it('should correctly amend user roles dynamically through Schema guard', async () => {
        if (!token || !createdUserId) return;

        const payload = {
             rol: 'ADMIN_FINANZAS'
        };

        const res = await request(app)
            .put(`/api/v1/auth/${createdUserId}/rol`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send(payload);
            
        expect(res.status).toBe(200);   
    });
});

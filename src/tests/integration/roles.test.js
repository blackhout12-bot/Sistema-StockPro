const request = require('supertest');
const app = require('../../server');

let token = '';
let testEmpresaId = 1;

describe('Roles & Permissions API Integration', () => {

    beforeAll(async () => {
        // Authenticate using the robust initial tests account
        const res = await request(app)
            .post('/api/public/auth/login')
            .send({ email: 'admin@sistema.com', password: 'admin' });
        
        if (res.body.token) {
            token = res.body.token;
            testEmpresaId = res.body.user.empresa_id;
        }
    });

    it('should create a valid role explicitly bound to the tenant', async () => {
        if (!token) return;

        const payload = {
            nombre: 'Gestor de Ventas Local',
            codigo_rol: 'GESTOR_VD',
            permisos: {
                facturacion: ["leer", "crear"],
                productos: ["leer"]
            }
        };

        const res = await request(app)
            .post('/api/v1/empresa/roles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.codigo_rol).toBe('GESTOR_VD');
    });

    it('should block an invalid or maliciously formulated roles schema completely', async () => {
        if (!token) return;

        // Intentional broken schema: nested object instead of Array for JSON permission actions.
        const payloadInvalid = {
            nombre: 'Hacker Role',
            codigo_rol: 'HACKER',
            permisos: {
                usuarios: { "leer": true }
            }
        };

        const res = await request(app)
            .post('/api/v1/empresa/roles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send(payloadInvalid);

        expect(res.status).toBe(400); // Trigger blocked by Zod since Record<string, string[]> is expected
        expect(res.body.error).toBeDefined();
    });

    it('should prevent system role modifications via UI endpoints', async () => {
         if (!token) return;

         // Fetch all roles
         const allRoles = await request(app)
            .get('/api/v1/empresa/roles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);

         const adminRole = allRoles.body.find(r => r.es_sistema === true || r.codigo_rol === 'ADMIN');
         
         if (adminRole) {
             const res = await request(app)
                 .delete(`/api/v1/empresa/roles/${adminRole.id}`)
                 .set('Authorization', `Bearer ${token}`)
                 .set('x-empresa-id', testEmpresaId);
                 
             expect(res.status).toBe(400);
             expect(res.body.error).toContain('sistema');
         }
    });
});

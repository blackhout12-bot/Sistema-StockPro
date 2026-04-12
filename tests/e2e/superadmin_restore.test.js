const request = require('supertest');
const app = require('../../src/server');

/**
 * v1.28.2-superadmin-panel-restore-tests
 * Validación E2E del bypass y propagación de planes.
 */

describe('SuperAdmin Panel Restore E2E Tests', () => {

    test('Superadmin puede logearse y el sistema reconoce su rol global', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'superadmin@tbgestion.local', password: 'SuperAdmin2026!' });

        expect(res.status).toBe(200);
        // El login puede devolver token directamente o requerir selección si tiene varias empresas.
        // Pero el superadmin suele logearse directo o al menos devolver el objeto user con rol.
        expect(res.body.user.rol).toBe('superadmin');
    });

    test('Superadmin puede cambiar el plan de una empresa y regenerar toggles', async () => {
        // 1. Login superadmin
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'superadmin@tbgestion.local', password: 'SuperAdmin2026!' });
        
        const token = loginRes.body.token;

        // 2. Ejecutar cambio de plan (Empresa 1 -> Full Enterprise ID 5)
        const res = await request(app)
            .post('/api/v1/superadmin/changePlan')
            .set('Authorization', `Bearer ${token}`)
            .send({ empresaId: 1, nuevoPlanId: 5 });

        expect(res.status).toBe(200);
        expect(res.body.planId).toBe(5);
        expect(res.body.planNombre).toBe('Full Enterprise');
        expect(res.body.feature_toggles).toBeDefined();
    });

    test('El middleware tenantContext y RBAC aplican bypass para superadmin', async () => {
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'superadmin@tbgestion.local', password: 'SuperAdmin2026!' });
        
        const token = loginRes.body.token;

        // Ruta de facturación (protegida por tenantContext y RBAC)
        const res = await request(app)
            .get('/api/v1/facturacion/comprobantes')
            .set('Authorization', `Bearer ${token}`);

        // Ahora que aplicamos el bypass en RBAC, debería dar 200 (o al menos no 403)
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});

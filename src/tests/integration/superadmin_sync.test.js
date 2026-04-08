const request = require('supertest');
const app = require('../../server');

describe('SuperAdmin Sync & Bypass Integration Tests (v1.28.2)', () => {
  
  test('Superadmin puede logearse sin restricciones', async () => {
    // Nota: El endpoint real es /api/auth/login o /api/v1/auth/login
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@tbgestion.local', password: 'SuperAdmin2026!' });

    expect(res.status).toBe(200);
    // Cambiamos 'role' por 'rol' según la estructura real del proyecto
    expect(res.body.user.rol).toBe('superadmin');
  });

  test('Superadmin cambia plan de empresa', async () => {
    // Primero logeamos para tener token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@tbgestion.local', password: 'SuperAdmin2026!' });
    
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/v1/superadmin/changePlan')
      .set('Authorization', `Bearer ${token}`)
      .send({ empresaId: 1, nuevoPlanId: 2 }); // IDs de ejemplo para StockDB

    expect(res.status).toBe(200);
    expect(res.body.planId).toBe(2);
    // Verificamos formato del response (camelCase v1.28.2-fix)
    expect(res.body).toHaveProperty('feature_toggles');
    
    // Verificamos bypass de middleware (si feature_toggles contiene '*')
    // En este sistema, '*' es el valor para FULL
    if (res.body.feature_toggles['*']) {
      expect(res.body.feature_toggles['*']).toBe(true);
    }
  });

});

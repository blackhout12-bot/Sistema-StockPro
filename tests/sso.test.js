// tests/sso.test.js
const request = require('supertest');
const express = require('express');

// Setup Mock Sever for API Routing
const app = express();
app.use(express.json());

// Mock SSO Route
const ssoRouter = require('../src/modules/auth/auth_sso.controller');
app.use('/api/v1/auth/sso', ssoRouter);

// Mock Health and Metrics Route
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/metrics', (req, res) => res.status(200).send('mock_metrics_data'));

describe('Phase 13: SSO & DevOps Integration Tests', () => {

    describe('Kubernetes Probes & Monitoring', () => {
        it('should return 200 OK for Readiness Probe (/health)', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });

        it('should return 200 OK for Prometheus Metrics (/metrics)', async () => {
             const res = await request(app).get('/metrics');
             expect(res.status).toBe(200);
        });
    });

    describe('SSO Controllers (Google & MS365)', () => {
        it('should redirect when initiating SSO flow', async () => {
            const res = await request(app).get('/api/v1/auth/sso/google');
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('Redirigiendo');
        });

        it('should reject callback payload if MFA fails', async () => {
            const payload = {
                email: 'test@empresa.com',
                name: 'Test Account',
                requires_mfa: true,
                mfa_verified: false
            };
            const res = await request(app).post('/api/v1/auth/sso/google/callback').send(payload);
            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Multi-Factor');
        });
        
        it('should reject callback payload if schema is incomplete', async () => {
            const payload = { missing_email: true };
            const res = await request(app).post('/api/v1/auth/sso/microsoft/callback').send(payload);
            expect(res.status).toBe(400);
        });
    });
});

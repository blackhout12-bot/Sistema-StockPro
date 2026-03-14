const request = require('supertest');
const app = require('../../server');

describe('Health Check Endpoint', () => {
    it('should return 200 or 207 and status ok', async () => {
        const response = await request(app).get('/health');
        expect([200, 207]).toContain(response.status);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('time');
    });
});

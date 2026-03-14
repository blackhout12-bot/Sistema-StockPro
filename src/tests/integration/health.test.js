const request = require('supertest');
const app = require('../../server');

describe('Health Check Endpoint', () => {
    it('should return 200 and status ok', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('time');
    });
});

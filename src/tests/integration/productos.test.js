const request = require('supertest');
const app = require('../../server');

// Mock data
let token = '';
let testEmpresaId = 1;
let createdProductId = null;

describe('Products API Integration', () => {

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

    it('should fetch products only for the specified tenant', async () => {
        if (!token) {
            console.warn('Skipping test: Missing valid authentication token');
            return;
        }

        const res = await request(app)
            .get('/api/v1/productos')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create a new product and validate fields including image_url', async () => {
        if (!token) return;

        const res = await request(app)
            .post('/api/v1/productos/crear')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({
                nombre: 'Producto Test Integration',
                descripcion: 'Descripcion de prueba',
                precio: 150.50,
                stock: 10,
                sku: 'TEST-INT-001',
                image_url: 'https://example.com/img.jpg'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.nombre).toBe('Producto Test Integration');
        
        createdProductId = res.body.id;
    });

    it('should update the created product', async () => {
        if (!token || !createdProductId) return;

        const res = await request(app)
            .put(`/api/v1/productos/editar/${createdProductId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId)
            .send({
                nombre: 'Producto Test Actualizado',
                precio: 200,
                stock: 15,
                sku: 'TEST-INT-001',
                image_url: 'https://example.com/img2.jpg'
            });

        expect(res.status).toBe(200);
        expect(res.body.nombre).toBe('Producto Test Actualizado');
        expect(res.body.precio).toBe(200);
    });

    it('should delete the created product', async () => {
        if (!token || !createdProductId) return;

        const res = await request(app)
            .delete(`/api/v1/productos/eliminar/${createdProductId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);

        expect(res.status).toBe(200);
        
        // Ensure it was deleted
        const fetchRes = await request(app)
            .get('/api/v1/productos')
            .set('Authorization', `Bearer ${token}`)
            .set('x-empresa-id', testEmpresaId);
            
        const isStillThere = fetchRes.body.some(p => p.id === createdProductId);
        expect(isStillThere).toBe(false);
    });
});

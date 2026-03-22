const axios = require('axios');
(async () => {
    try {
        console.log("Iniciando prueba de creacion de producto...");
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'egardo@example.com',
            password: 'admin' // Intentamos password admin u otra
        }).catch(async (e) => {
             return await axios.post('http://localhost:5000/api/v1/auth/login', {
                email: 'egardo@example.com',
                password: 'password' // Quizás?
            });
        }).catch(async () => {
             return await axios.post('http://localhost:5000/api/v1/auth/login', {
                email: 'admin@stockpro.com',
                password: 'admin' 
            });
        });
        
        const token = loginRes.data.token;
        console.log("Token obtenido, enviando POST /productos/crear...");
        
        const res = await axios.post('http://localhost:5000/api/v1/productos/crear', {
            nombre: 'Test API',
            sku: 'TEST-001',
            descripcion: 'Un test',
            precio: 1000,
            stock: 10,
            categoria: 'General',
            custom_fields: { test_field: 'works' }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Producto creado OK:", res.data);
    } catch(e) {
        console.error("Error en creacion:", e.response ? e.response.data : e.message);
    }
})();

const axios = require('axios');
(async () => {
    try {
        console.log("Iniciando prueba de productos...");
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'egardo@example.com',
            password: 'admin' // Intentamos password admin u otra
        }).catch(async () => {
             return await axios.post('http://localhost:5000/api/v1/auth/login', {
                email: 'egardo@example.com',
                password: 'password' // Quizás?
            });
        });
        
        const token = loginRes.data.token;
        console.log("Token obtenido, consultando productos...");
        
        const prods = await axios.get('http://localhost:5000/api/v1/productos?page=1&limit=20', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Productos OK:", prods.data);
    } catch(e) {
        console.error("Error en consulta:", e.response ? e.response.data : e.message);
    }
})();

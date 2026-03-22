const axios = require('axios');

(async () => {
    try {
        console.log("Intentando Login en 5001...");
        const loginRes = await axios.post('http://localhost:5001/api/v1/auth/login', {
            email: 'egardo@example.com',
            password: 'admin' // la const password usual
        }).catch(async () => {
             return await axios.post('http://localhost:5001/api/v1/auth/login', {
                email: 'edgardo@example.com',
                password: 'password' // Quizás?
            });
        }).catch(async () => {
             return await axios.post('http://localhost:5001/api/v1/auth/login', {
                email: 'admin@stockpro.com',
                password: 'admin' 
            });
        });

        const token = loginRes.data.token;
        console.log("Token obtenido. Fetching /productos...");

        const prodRes = await axios.get('http://localhost:5001/api/v1/productos?page=1&limit=20', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Productos devueltos OK");

        console.log("Intentando listar rubros schemas...");
        const schRes = await axios.get('http://localhost:5001/api/v1/productos/categorias/esquemas', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Schemas devueltos OK:", schRes.data.length);

        console.log("TODO OK HTTP.");

    } catch(err) {
        if(err.response) {
            console.error("HTTP ERROR:", err.response.status, err.response.data);
        } else {
            console.error("ERROR:", err.message);
        }
    }
})();

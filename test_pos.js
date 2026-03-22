const axios = require('axios');
(async () => {
    try {
        console.log("Iniciando prueba de cajas...");
        // Primero hacemos login para obtener token
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'admin@stockpro.com',
            password: 'admin' // asumo 'admin', si no tira error 401
        }).catch(async (err) => {
            console.log("Fallback login test");
            return await axios.post('http://localhost:5000/api/v1/auth/login', {
                email: 'admin@stockpro.com',
                password: 'admin123' 
            });
        });
        
        const token = loginRes.data.token;
        console.log("Token obtenido, consultando cajas...");
        
        const cajasRes = await axios.get('http://localhost:5000/api/v1/pos/cajas', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Cajas consultadas OK:", cajasRes.data);
    } catch(e) {
        console.error("Error en consulta:", e.response ? e.response.data : e.message);
    }
})();

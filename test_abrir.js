const axios = require('axios');
(async () => {
    try {
        console.log("Iniciando prueba de cajas...");
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
        console.log("Token obtenido, abriendo turno...");
        
        const openRes = await axios.post('http://localhost:5000/api/v1/pos/sesion/abrir', {
            caja_id: 2,
            monto_inicial: 5000
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Turno abierto OK:", openRes.data);
    } catch(e) {
        console.error("Error en consulta:", e.response ? e.response.data : e.message);
    }
})();

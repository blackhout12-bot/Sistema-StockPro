const axios = require('axios');

async function testApi() {
    try {
        console.log("Iniciando login...");
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@demo.com', // or test@demo.com
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log("Token obtenido:", token.substring(0, 20) + '...');

        console.log("Obteniendo clientes y productos...");
        const [cliRes, prodRes] = await Promise.all([
            axios.get('http://localhost:5000/api/clientes', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://localhost:5000/api/productos', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const cliente = cliRes.data[0];
        const producto = prodRes.data.find(p => p.stock > 0);

        if (!cliente || !producto) {
            console.log("Faltan clientes o productos con stock.");
            return;
        }

        const payload = {
            cliente_id: parseInt(cliente.id),
            total: parseFloat(producto.precio.toFixed(2)),
            detalles: [{
                producto_id: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precio_unitario: producto.precio,
                subtotal: producto.precio
            }]
        };

        console.log("Enviando factura:", payload);
        const res = await axios.post('http://localhost:5000/api/facturacion', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Exitoso:", res.data);

    } catch (e) {
        console.error("API ERROR:", e.response ? e.response.data : e.message);
    }
}
testApi();

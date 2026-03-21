const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
    try {
        console.log("Generando superadmin token...");
        const token = jwt.sign({ id: 1, rol: 'admin', empresa_id: 1 }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
        
        const api = axios.create({
            baseURL: 'http://localhost:5001/api/v1',
            headers: {
                Authorization: `Bearer ${token}`,
                'x-empresa-id': '1'
            }
        });

        console.log("Probando Facturacion...");
        try {
            const fact = await api.post('/facturacion', {
                clienteId: 1, 
                tipo_comprobante: 'Factura',
                metodoPago: 'Efectivo',
                total: 100,
                items: [
                    { producto_id: 1, cantidad: 1, precio_unitario: 100, subtotal: 100 }
                ]
            });
            console.log("Facturacion OK:", fact.data);
        } catch (e) {
            console.error("Error en Facturacion:", e.response?.data || e.message);
        }

        console.log("Probando Lotes...");
        try {
            const lotes = await api.get('/productos/1/lotes');
            console.log("Lotes OK:", lotes.data);
        } catch (e) {
            console.error("Error en Lotes:", e.response?.data || e.message);
        }

        console.log("Probando Movimiento de entrada con Lote...");
        try {
            const mov = await api.post('/movimientos', {
                productoId: 1,
                tipo: 'entrada',
                cantidad: 10,
                costo_unitario: 50,
                nro_lote: 'LOTE-TEST-123',
                fecha_vto: '2026-12-31'
            });
            console.log("Movimiento Lotes OK:", mov.data);
        } catch (e) {
            console.error("Error en Movimiento Lotes:", e.response?.data || e.message);
        }


    } catch (err) {
        console.error("Global Error:", err);
    }
}
run();

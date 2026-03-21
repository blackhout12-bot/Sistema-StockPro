require('dotenv').config();
const jwt = require('jsonwebtoken');

async function run() {
    const token = jwt.sign({ id: 1, rol: 'admin', empresa_id: 1 }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-empresa-id': '1',
        'Content-Type': 'application/json'
    };

    console.log("=== Probando Facturacion ===");
    try {
        const res = await fetch('http://localhost:5001/api/v1/facturacion', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                cliente_id: 1, 
                tipo_comprobante: 'Factura',
                metodo_pago: 'Efectivo',
                total: 100,
                detalles: [
                    { producto_id: 1, cantidad: 1, precio_unitario: 100, subtotal: 100 }
                ]
            })
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text}`);
    } catch (e) {}

    console.log("=== Probando Lotes ===");
    try {
        const res = await fetch('http://localhost:5001/api/v1/productos/1/lotes', { headers });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text}`);
    } catch (e) {}
}
run();

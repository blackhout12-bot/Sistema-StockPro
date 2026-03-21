const fs = require('fs');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function run() {
    const token = jwt.sign({ id: 1, rol: 'admin', empresa_id: 1 }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    const res = await fetch('http://localhost:5001/api/v1/facturacion/96/pdf', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-empresa-id': '1'
        }
    });
    console.log(`Status: ${res.status}`);
    if (res.status === 200) {
        const buffer = await res.arrayBuffer();
        fs.writeFileSync('test_factura.pdf', Buffer.from(buffer));
        console.log("PDF descargado correctamente: byte length", buffer.byteLength);
    } else {
        console.log(`Error: ${await res.text()}`);
    }
}
run();

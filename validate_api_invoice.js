const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_1234567890';
const API_URL = 'http://localhost:5001/api/v1/facturacion';

async function validateInvoice() {
    // 1. Generar Token (Usando id: 2 que pertenece a empresa_id: 1)
    const token = jwt.sign({ 
        id: 2, 
        email: 'admin@test.com', 
        rol: 'admin',
        empresa_id: 1 
    }, SECRET, { expiresIn: '1h' });

    console.log('Token generado.');

    // 2. Datos de prueba (Aspirinas id: 36 para empresa 1)
    const payload = {
        cliente_id: 1,
        sucursal_id: 1,
        metodo_pago: 'Efectivo',
        tipo_comprobante: 'Factura',
        total: 100.00,
        subtotal: 82.64,
        impuestos: 17.36,
        detalles: [
            {
                producto_id: 36,
                cantidad: 2,
                precio_unitario: 50.00,
                subtotal: 100.00,
                deposito_id: 1
            }
        ]
    };

    try {
        console.log('Enviando POST /api/v1/facturacion...');
        const response = await axios.post(API_URL, payload, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'x-tenant-id': '1'
            }
        });

        console.log('Respuesta recibida:', response.status);
        console.log('Factura ID devuelto (SCOPE_IDENTITY):', response.data.id || response.data);

        if (response.status === 201) {
            console.log('VALIDACIÓN EXITOSA: Factura creada correctamente.');
            process.exit(0);
        } else {
            console.error('Error: Código de estado inesperado:', response.status);
            process.exit(1);
        }
    } catch (error) {
        console.error('Error en la petición:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

validateInvoice();

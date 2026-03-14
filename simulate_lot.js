const { connectDB, sql } = require('./src/config/db');
const movimientoRepo = require('./src/repositories/movimiento.repository');
require('dotenv').config();

async function simulate() {
    try {
        console.log('--- SIMULANDO REGISTRO DE MOVIMIENTO CON LOTE ---');
        const data = {
            productoId: 1, // Laptop
            tipo: 'entrada',
            cantidad: 5,
            nro_lote: 'SIM-LOTE-456',
            fecha_vto: '2026-12-31'
        };
        const usuarioId = 2; // Admin
        const empresaId = 1;

        const result = await movimientoRepo.create(data, usuarioId, empresaId);
        console.log('Éxito:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('!!! ERROR DETECTADO !!!');
        console.error('Mensaje:', e.message);
        console.error('Código:', e.code);
        console.error('Pila:', e.stack);
        if (e.precedingErrors) {
            console.error('Errores precedentes:', JSON.stringify(e.precedingErrors, null, 2));
        }
        process.exit(1);
    }
}

simulate();

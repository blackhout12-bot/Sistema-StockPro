const { connectDB } = require('./src/config/db');
const movRepo = require('./src/repositories/movimiento.repository');
const loteRepo = require('./src/repositories/lote.repository');

async function test() {
    try {
        const pool = await connectDB();
        console.log('Testing create mov');
        const res = await movRepo.create({
            productoId: 48,
            tipo: 'entrada',
            cantidad: 5,
            nro_lote: 'LOTE-CRASH',
            fecha_vto: '2025-12-12'
        }, 1, 59);
        console.log('SUCCESS:', res);
        process.exit(0);
    } catch(e) {
        console.error('CRASH:', e);
        process.exit(1);
    }
}
test();

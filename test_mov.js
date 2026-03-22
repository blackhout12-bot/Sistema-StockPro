require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');
const movRepo = require('./src/repositories/movimiento.repository');

async function test() {
    try {
        await connectDB();
        console.log("DB Connected.");
        // Try simple entrada
        const res = await movRepo.create({
            productoId: 1,
            tipo: 'entrada',
            cantidad: 5,
            deposito_id: 1
        }, 1, 1);
        console.log("Success Entrada:", res);
        
        // Try transferencia using transferencias controller logic directly or through API if we had it.
        // But since we saw "el modulo de movimiento no funciona", let's check basic repo.
    } catch(e) {
        console.error("Error Entrada:", e);
    }
    process.exit(0);
}
test();

require('dotenv').config();
const { connectDB } = require('./src/config/db');
const prodRepo = require('./src/repositories/producto.repository');

async function check() {
    try {
        const pool = await connectDB();
        console.log("DB Connected.");
        
        // Test getAll
        const res1 = await prodRepo.getAll(pool, 1);
        console.log("getAll success, rows:", res1.length);
        
        // Test getPaginated
        const res2 = await prodRepo.getPaginated(pool, { empresa_id: 1, page: 1, limit: 10 });
        console.log("getPaginated success, rows:", res2.data.length);
        
    } catch(e) {
        console.error("Error executing query:", e);
    }
    process.exit(0);
}
check();

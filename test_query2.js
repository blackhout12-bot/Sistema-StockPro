require('dotenv').config();
const { connectDB } = require('./src/config/db');
const prodRepo = require('./src/repositories/producto.repository');

async function check() {
    try {
        const pool = await connectDB();
        const res1 = await prodRepo.getAll(pool, 1);
        console.log(JSON.stringify(res1.slice(0, 2), null, 2));
    } catch(e) {
        console.error("Error executing query:", e);
    }
    process.exit(0);
}
check();

require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');
const prodRepo = require('./src/repositories/producto.repository');

async function check() {
    try {
        const pool = await connectDB();
        console.log("DB Connected.");
        
        let id = await prodRepo.create(pool, {
            nombre: "Test Product",
            descripcion: "Test",
            precio: 100,
            stock: 10,
            sku: "TEST-01",
            moneda_id: "ARS"
        }, 1);
        console.log("Created ID:", id);
        
        await prodRepo.update(pool, id, {
            nombre: "Test Product",
            descripcion: "Test",
            precio: 150,
            stock: 10,
            categoria: "Cat",
            sku: "TEST-01"
        }, 1);
        console.log("Updated ID:", id);

        await prodRepo.delete(pool, id, 1);
        console.log("Deleted ID:", id);

    } catch(e) {
        console.error("Error executing query:", e);
    }
    process.exit(0);
}
check();

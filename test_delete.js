require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');
const prodService = require('./src/modules/productos/productos.service');

async function check() {
    try {
        await connectDB();
        console.log("DB Connected.");
        
        let created = await prodService.agregarProducto(
            "Delete Me", "To be deleted", 100, 50, "Cat", 1, "DELETE-01", "ARS", {}
        );
        console.log("Created ID:", created.id);
        
        await prodService.borrarProducto(created.id, 1);
        console.log("Deleted ID successfully:", created.id);

    } catch(e) {
        console.error("Error executing query:", e);
    }
    process.exit(0);
}
check();

const { connectDB } = require('./src/config/db');

async function check() {
    try {
        const pool = await connectDB();
        const r1 = await pool.query("SELECT name FROM sys.tables WHERE name = 'Contextos_Usuarios'");
        console.log("Tabla Contextos_Usuarios:", r1.recordset);
        
        const r2 = await pool.query("SELECT name FROM sys.tables WHERE name = 'Contextos'");
        console.log("Tabla Contextos:", r2.recordset);
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();

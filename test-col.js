require('dotenv').config();
const { connectDB } = require('./src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        const r1 = await pool.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'actualizado_en'");
        console.log("hasActualizadoEnColumn (No Schema):", r1.recordset.length > 0);
        
        const r2 = await pool.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'actualizado_en'");
        console.log("hasActualizadoEnColumn (With dbo):", r2.recordset.length > 0);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();

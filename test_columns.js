const { connectDB } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const resSuc = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sucursales'");
        console.log("Sucursales:", resSuc.recordset.map(r => r.COLUMN_NAME).join(', '));
        
        const resDep = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Depositos'");
        console.log("Depositos:", resDep.recordset.map(r => r.COLUMN_NAME).join(', '));
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();

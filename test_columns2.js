const { connectDB } = require('./src/config/db');
const fs = require('fs');
(async () => {
    try {
        const pool = await connectDB();
        const resSuc = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sucursales'");
        const resDep = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Depositos'");
        
        fs.writeFileSync('cols.json', JSON.stringify({
            suc: resSuc.recordset.map(r => r.COLUMN_NAME),
            dep: resDep.recordset.map(r => r.COLUMN_NAME)
        }, null, 2));
        process.exit(0);
    } catch(e) {
        process.exit(1);
    }
})();

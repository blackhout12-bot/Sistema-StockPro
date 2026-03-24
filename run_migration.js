const { connectDB } = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const pool = await connectDB();
        const sql = fs.readFileSync(path.join(__dirname, 'src/migrations/011_precios_sucursal.sql'), 'utf-8');
        
        // Remove GO statements for tedious node execution
        const batches = sql.split('GO').filter(b => b.trim() !== '');
        
        for (let batch of batches) {
            await pool.request().query(batch);
        }
        console.log('Migración 011_precios_sucursal ejecutada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error migrando:', error);
        process.exit(1);
    }
}
migrate();

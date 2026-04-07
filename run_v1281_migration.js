const { connectDB } = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'src', 'migrations', 'v1.28.1_planes_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Conectando a StockDB...');
        const pool = await connectDB();
        
        console.log('Ejecutando migración v1.28.1 (Planes)...');
        
        // El driver mssql no soporta GO, así que dividimos el script
        const batches = sql.split(/\bGO\b/i);
        
        for (let batch of batches) {
            if (batch.trim()) {
                await pool.request().query(batch);
            }
        }
        
        console.log('✅ Migración completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error ejecutando migración:', err);
        process.exit(1);
    }
}

runMigration();

const fs = require('fs');
const path = require('path');
const { connectDB } = require('./src/config/db');

async function run() {
    try {
        console.log('Connecting to database...');
        const pool = await connectDB();
        
        const sqlPath = path.join(__dirname, 'src', 'migrations', '020_tabla_sucursales.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Executing migration 020_tabla_sucursales.sql...');
        const result = await pool.request().query(sqlQuery);
        console.log('Migration executed successfully:', result);
        
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();

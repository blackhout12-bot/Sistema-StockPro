require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, closeDB } = require('./src/config/db');

async function runMigration() {
    try {
        console.log('Iniciando migración 013_depositos_y_transferencias...');
        const pool = await connectDB();
        
        const sqlFilePath = path.join(__dirname, 'src/migrations/013_depositos_y_transferencias.sql');
        const sqlString = fs.readFileSync(sqlFilePath, 'utf8');

        // Split by GO if exists (though we didn't put GO, we just put BEGIN/COMMIT TRAN)
        const request = pool.request();
        await request.query(sqlString);
        
        console.log('Migración completada con éxito.');
        await closeDB();
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err.message);
        if (err.precedingErrors) {
             err.precedingErrors.forEach(pe => console.error('  - ', pe.message));
        }
        await closeDB();
        process.exit(1);
    }
}

runMigration();

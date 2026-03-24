const fs = require('fs');
const path = require('path');
const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function runMigration() {
    try {
        const pool = await connectDB();
        const sqlScript = fs.readFileSync(path.join(__dirname, 'src', 'migrations', '024_auditoria_extendida.sql'), 'utf-8');
        
        // SQL Server node driver doesn't support executing GO separated batches directly
        const batches = sqlScript.split(/GO\s*(?:\r?\n|$)/i).filter(b => b.trim().length > 0);
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        for (let batch of batches) {
            if (batch.trim() === '') continue;
            try {
                const request = new sql.Request(transaction);
                await request.query(batch);
                console.log('Batch ejecutado correctamente.');
            } catch (err) {
                console.error('Error al ejecutar batch:\\n', batch, '\\n\\nError message:', err.message);
                await transaction.rollback();
                process.exit(1);
            }
        }
        
        await transaction.commit();
        console.log('✅ Migración 024_auditoria_extendida.sql ejecutada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('Error global:', err);
        process.exit(1);
    }
}

runMigration();

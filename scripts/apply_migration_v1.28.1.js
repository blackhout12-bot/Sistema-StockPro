const sql = require('mssql');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function runMigration() {
    try {
        console.log('Connecting to database...');
        let pool = await sql.connect(config);
        console.log('Connected.');

        const filePath = path.join(__dirname, '../src/migrations/v1.28.1_final_schema.sql');
        const sqlScript = fs.readFileSync(filePath, 'utf8');

        // Split by GO since mssql doesn't support it directly
        const batches = sqlScript.split(/^\s*GO\s*$/m);

        for (let batch of batches) {
            if (batch.trim()) {
                console.log('Executing batch...');
                await pool.request().query(batch);
            }
        }

        console.log('Migration v1.28.1-final completed successfully.');
        await sql.close();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();

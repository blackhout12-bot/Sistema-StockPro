require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');

async function fix() {
    try {
        const pool = await connectDB();
        
        // Let's get column length
        const res = await pool.request().query(`
            SELECT CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Movimientos' AND COLUMN_NAME = 'tipo'
        `);
        console.log("Current Length:", res.recordset[0].CHARACTER_MAXIMUM_LENGTH);
        
        console.log("Altering table...");
        await pool.request().query(`
            ALTER TABLE Movimientos ALTER COLUMN tipo VARCHAR(50);
        `);
        console.log("Table altered successfully!");
    } catch(e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
fix();

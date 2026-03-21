const { connectDB } = require('./src/config/db');

async function migrate() {
    console.log('Connecting to DB para Origen Venta...');
    const pool = await connectDB();
    try {
        await pool.request().query(`
            ALTER TABLE Facturas ADD origen_venta NVARCHAR(50) DEFAULT 'Local';
        `);
        console.log('Columns origen_venta added successfully.');
    } catch (e) {
        if (e.message.includes('already has')) {
            console.log('Columns already exist.');
        } else {
            console.error('Migration error:', e);
        }
    }
    process.exit(0);
}

migrate();

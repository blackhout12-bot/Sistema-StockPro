const { connectDB } = require('./src/config/db');

async function migrate() {
    console.log('Connecting to DB...');
    const pool = await connectDB();
    try {
        await pool.request().query(`
            ALTER TABLE Clientes 
            ADD nivel_vip NVARCHAR(50) DEFAULT 'Bronce', 
                puntos INT DEFAULT 0;
        `);
        console.log('Columns added successfully.');
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

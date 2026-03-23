const { connectDB } = require('./src/config/db');

async function fix() {
    try {
        console.log('Conectando a BD...');
        const pool = await connectDB();
        
        console.log('Alterando tabla Facturas...');
        await pool.request().query('ALTER TABLE Facturas ALTER COLUMN cliente_id INT NULL');
        
        console.log('Alterando tabla Cuentas_Cobrar...');
        await pool.request().query('ALTER TABLE Cuentas_Cobrar ALTER COLUMN cliente_id INT NULL');
        
        console.log('Alterando tabla Cobros...');
        await pool.request().query('ALTER TABLE Cobros ALTER COLUMN cliente_id INT NULL');
        
        console.log('¡Éxito! Migraciones aplicadas.');
        process.exit(0);
    } catch (err) {
        console.error('Error aplicando migración:', err);
        process.exit(1);
    }
}

fix();

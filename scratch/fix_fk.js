const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('Applying FK_Deposito_Sucursal ON DELETE CASCADE...');
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Deposito_Sucursal')
                ALTER TABLE dbo.Depositos DROP CONSTRAINT FK_Deposito_Sucursal;
            
            ALTER TABLE dbo.Depositos ADD CONSTRAINT FK_Deposito_Sucursal 
            FOREIGN KEY (sucursal_id) REFERENCES dbo.Sucursales(id) ON DELETE CASCADE;
        `);
        console.log('OK');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

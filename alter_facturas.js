const { connectDB } = require('./src/config/db');

async function alterFacturas() {
    try {
        const pool = await connectDB();
        
        // 1. Check if column exists
        const check = await pool.request().query("SELECT 1 FROM sys.columns WHERE Name = N'sucursal_id' AND Object_ID = Object_ID(N'Facturas')");
        if (check.recordset.length === 0) {
            console.log('Adding sucursal_id to Facturas...');
            await pool.request().query(`
                ALTER TABLE Facturas ADD sucursal_id INT NULL;
                ALTER TABLE Facturas ADD CONSTRAINT FK_Facturas_Sucursales FOREIGN KEY (sucursal_id) REFERENCES Sucursales(id);
            `);
            
            // Backfill: asignarle la primera sucursal de la misma empresa a las facturas históricas
            console.log('Backfilling historic invoices with a default branch...');
            await pool.request().query(`
                UPDATE f
                SET f.sucursal_id = (SELECT TOP 1 id FROM Sucursales s WHERE s.empresa_id = f.empresa_id ORDER BY s.id ASC)
                FROM Facturas f
                WHERE f.sucursal_id IS NULL;
            `);
            console.log('Facturas table successfully altered and backfilled.');
        } else {
            console.log('Column already exists.');
        }
        
    } catch(e) {
        console.error('SQL Error:', e);
    }
    process.exit(0);
}

alterFacturas();

const sql = require('mssql');
require('dotenv').config();

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

async function testRLS() {
    try {
        let pool = await sql.connect(config);
        console.log('Connected to DB');

        // Insert dummy products for different companies if they don't exist
        await pool.request().query("IF NOT EXISTS (SELECT 1 FROM Productos WHERE empresa_id = 1) INSERT INTO Productos (nombre, precio, stock, empresa_id) VALUES ('Prod Empresa 1', 100, 10, 1)");
        await pool.request().query("IF NOT EXISTS (SELECT 1 FROM Productos WHERE empresa_id = 2) INSERT INTO Productos (nombre, precio, stock, empresa_id) VALUES ('Prod Empresa 2', 200, 20, 2)");

        // Test as Empresa 1
        console.log('\n--- Testing as Empresa 1 ---');
        let request1 = pool.request();
        await request1.query("EXEC sp_set_session_context @key=N'empresa_id', @value=1");
        let result1 = await request1.query("SELECT * FROM Productos");
        console.log(`Empresa 1 sees ${result1.recordset.length} products.`);
        result1.recordset.forEach(p => console.log(` - ID: ${p.id}, Name: ${p.nombre}, Empresa: ${p.empresa_id}`));

        // Test as Empresa 2
        console.log('\n--- Testing as Empresa 2 ---');
        let request2 = pool.request();
        await request2.query("EXEC sp_set_session_context @key=N'empresa_id', @value=2");
        let result2 = await request2.query("SELECT * FROM Productos");
        console.log(`Empresa 2 sees ${result2.recordset.length} products.`);
        result2.recordset.forEach(p => console.log(` - ID: ${p.id}, Name: ${p.nombre}, Empresa: ${p.empresa_id}`));

        await sql.close();
    } catch (err) {
        console.error('RLS Test failed:', err);
        process.exit(1);
    }
}

testRLS();

const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: { encrypt: false, trustServerCertificate: true }
};

async function checkTables() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT name FROM sys.tables ORDER BY name");
        console.log("Tablas en la BD:");
        console.table(result.recordset);
        
        const roles = await pool.request().query("IF EXISTS (SELECT * FROM sys.columns WHERE Name = 'rol' AND Object_ID = Object_ID('Usuarios')) SELECT DISTINCT rol FROM Usuarios");
        if (roles.recordset) {
            console.log("\nRoles en Usuarios:");
            console.table(roles.recordset);
        }

        const empresas = await pool.request().query("IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Empresas') SELECT * FROM Empresas");
        if (empresas.recordset) {
            console.log("\nContenido de Empresas:");
            console.table(empresas.recordset);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkTables();

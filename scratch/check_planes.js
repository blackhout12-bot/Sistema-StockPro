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

async function checkPlanes() {
    try {
        const pool = await sql.connect(config);
        const tables = await pool.request().query("SELECT name FROM sys.tables WHERE name LIKE '%Plan%' OR name LIKE '%Planes%'");
        console.log("Tablas relacionadas con Planes:");
        console.table(tables.recordset);

        if (tables.recordset.length > 0) {
            for (const table of tables.recordset) {
                const cols = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table.name}'`);
                console.log(`\nColumnas de ${table.name}:`);
                console.table(cols.recordset);
                
                const data = await pool.request().query(`SELECT TOP 5 * FROM ${table.name}`);
                console.log(`\nDatos de ${table.name}:`);
                console.table(data.recordset);
            }
        } else {
            // Check if Empresas has a plan_id column
            const empresaCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Empresas' AND COLUMN_NAME LIKE '%plan%'");
            console.log("\nColumnas relacionadas con planes en Empresas:");
            console.table(empresaCols.recordset);

            if (empresaCols.recordset.length > 0) {
                const data = await pool.request().query("SELECT TOP 5 nombre, plan_id FROM Empresas");
                console.log("\nDatos de planes en Empresas:");
                console.table(data.recordset);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

checkPlanes();

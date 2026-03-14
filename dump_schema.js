const sql = require('mssql');
require('dotenv').config({ path: './.env' }); // Root level .env
const fs = require('fs');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function dumpSchema() {
    try {
        const pool = await sql.connect(dbConfig);
        const resultEmpresa = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Empresa'");
        const resultUsuarios = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Usuarios'");

        const output = `
--- EMPRESA ---
${JSON.stringify(resultEmpresa.recordset, null, 2)}

--- USUARIOS ---
${JSON.stringify(resultUsuarios.recordset, null, 2)}
`;

        fs.writeFileSync('schema_dump.txt', output);
        console.log("Schema dumped to schema_dump.txt");
        process.exit(0);
    } catch (e) {
        console.error("ERROR: ", e);
        process.exit(1);
    }
}
dumpSchema();

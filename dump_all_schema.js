const sql = require('mssql');
require('dotenv').config({ path: './.env' });

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

async function dumpAllSchemas() {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('Empresa', 'Empresas', 'Sucursal', 'Sucursales', 'Deposito', 'Depositos', 'Usuario', 'Usuarios', 'Producto', 'Productos', 'AuditLog', 'AuditLogs', 'Comprobante', 'Comprobantes')
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);

        const schema = {};
        for (const row of result.recordset) {
            if (!schema[row.TABLE_NAME]) schema[row.TABLE_NAME] = [];
            schema[row.TABLE_NAME].push({
                column: row.COLUMN_NAME,
                type: row.DATA_TYPE,
                nullable: row.IS_NULLABLE
            });
        }

        const fs = require('fs');
        fs.writeFileSync('all_schemas_dump.json', JSON.stringify(schema, null, 2));
        console.log("SUCCESS");
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}
dumpAllSchemas();

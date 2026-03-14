const sql = require('mssql');
require('dotenv').config({ path: '../.env' });
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(config)
    .then(pool => pool.request().query(`
    SELECT 
        s.name AS SchemaName,
        t.name AS TableName
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = 'Productos'
  `)
        .then(res => {
            console.log("Estructura de la tabla Productos:");
            console.table(res.recordset);
            process.exit(0);
        })
        .catch(err => {
            console.log("Error SQL:", err.message);
            process.exit(1);
        })
    )
    .catch(err => {
        console.error("Error Conexion:", err.message);
        process.exit(1);
    });

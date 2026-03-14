const sql = require('mssql');
require('dotenv').config({ path: '../.env' });
const config = {
    user: 'sa',
    password: 'Admin123!',
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(config)
    .then(pool => pool.request().query('ALTER TABLE dbo.Productos ADD categoria VARCHAR(255) NULL')
        .then(() => {
            console.log("Categoria agregada exitosamente por SA");
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

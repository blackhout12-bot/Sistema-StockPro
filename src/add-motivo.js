const sql = require('mssql');
require('dotenv').config({ path: '../.env' });
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(config)
    .then(pool => pool.request().query("ALTER TABLE Movimientos ADD motivo VARCHAR(255) NULL")
        .then(res => {
            console.log("Columna agregada exitosamente");
            process.exit(0);
        })
        .catch(err => {
            console.log("Error de SQL:", err);
            process.exit(1);
        })
    )
    .catch(err => {
        console.error("Error conectando a BD:", err.message);
        process.exit(1);
    });

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
    .then(pool => {
        const createQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Empresa' and xtype='U')
            BEGIN
                CREATE TABLE Empresa (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    documento_identidad VARCHAR(50) NOT NULL,
                    direccion VARCHAR(255),
                    telefono VARCHAR(50),
                    email VARCHAR(100)
                );
                
                -- Insertar registro por defecto si está vacía
                INSERT INTO Empresa (nombre, documento_identidad, direccion, telefono, email) 
                VALUES ('Mi Empresa S.A.', '123456789-0', 'Calle Principal 123', '+56 9 1234 5678', 'contacto@miempresa.com');

                PRINT 'Tabla Empresa creada con registro inicial.';
            END
            ELSE
            BEGIN
                PRINT 'La tabla Empresa ya existe.';
            END
        `;
        return pool.request().query(createQuery);
    })
    .then(() => {
        console.log("Tabla Empresa procesada exitosamente por SA");
        process.exit(0);
    })
    .catch(err => {
        console.error("Error SQL:", err.message);
        process.exit(1);
    });

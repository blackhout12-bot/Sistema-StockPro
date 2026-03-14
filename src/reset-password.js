const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        let pool = await sql.connect(dbConfig);

        const email = "edgardo@example.com";
        const password = "123456";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        let result = await pool.request().query(`SELECT * FROM Usuarios WHERE email = '${email}'`);
        if (result.recordset.length === 0) {
            console.log('El usuario no existe. Creándolo...');
            await pool.request().query(`INSERT INTO Usuarios (nombre, email, password_hash, rol) VALUES ('Edgardo', '${email}', '${hashedPassword}', 'admin')`);
            console.log('Usuario creado exitosamente con rol admin.');
        } else {
            console.log('Usuario encontrado. Actualizando contraseña y asegurando rol admin...');
            await pool.request().query(`UPDATE Usuarios SET password_hash = '${hashedPassword}', rol = 'admin' WHERE email = '${email}'`);
            console.log('Usuario actualizado exitosamente.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();

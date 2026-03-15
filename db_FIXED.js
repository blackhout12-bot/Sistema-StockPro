// db_FIXED.js (FRAGMENTO CORREGIDO PARA APLICAR EN PRODUCCIÓN)
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        // ─── MITIGACIÓN VULN-002: SQL TLS Encriptación ─────────────
        encrypt: true, // Requerido para Azure y conexiones seguras
        trustServerCertificate: false, // NO usar 'true' en producción para evitar MITM
        enableArithAbort: true,
        cryptoCredentialsDetails: {
            minVersion: 'TLSv1.2' // Forzar criptografía moderna (TLS 1.3 ideal si soporta)
        }
    },
    pool: {
        max: 100,
        min: 5,
        idleTimeoutMillis: 30000
    }
};

let poolContext = null;

async function connectDB() {
    if (poolContext) return poolContext;
    try {
        poolContext = await sql.connect(dbConfig);
        console.log('Conexión segura a MS SQL Server establecida (TLS activado).');
        return poolContext;
    } catch (err) {
        console.error('Database connection failed: ', err);
        throw err;
    }
}

module.exports = { connectDB, sql };

const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const configSA = {
    user: 'sa',
    password: 'Sa123456!',
    server: 'localhost',
    database: 'StockDB',
    options: { encrypt: false, trustServerCertificate: true }
};

async function forceGrant() {
    try {
        console.log('⏳ Intentando conexión como SA...');
        const pool = await sql.connect(configSA);
        console.log('✅ Conectado como SA.');

        const query = "ALTER ROLE db_ddladmin ADD MEMBER [stock_user]";
        await pool.request().query(query);
        console.log('✅ Permisos db_ddladmin otorgados a stock_user.');

        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fatal:', err.message);
        process.exit(1);
    }
}

forceGrant();

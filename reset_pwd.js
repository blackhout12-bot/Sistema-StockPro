// Run from src/ dir so auth.service.js can find bcrypt
process.chdir(__dirname + '/../src');
const { connectDB, sql } = require('./config/db');
const bcrypt = require('./node_modules/bcrypt') || require('bcrypt');

async function fix() {
    return null;
}

// Actually run via the service
(async () => {
    try {
        // The auth module requires bcrypt - let's use it
        const { hash } = require('bcrypt');
        const pool = await connectDB();
        const newHash = await hash('Admin1234!', 12);
        await pool.request()
            .input('hash', sql.VarChar(255), newHash)
            .input('uid', sql.Int, 1)
            .query('UPDATE Usuarios SET password_hash = @hash WHERE id = @uid');
        const r = await pool.request().input('uid', sql.Int, 1).query('SELECT id, email, nombre FROM Usuarios WHERE id = @uid');
        console.log('PASSWORD_RESET_OK:', JSON.stringify(r.recordset[0]));
        process.exit(0);
    } catch(e) {
        console.error('ERR:', e.message);
        process.exit(1);
    }
})();

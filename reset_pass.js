const { connectDB, sql } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function reset() {
    try {
        const pool = await connectDB();
        const hash = await bcrypt.hash('123456', 12);
        await pool.request()
            .input('email', sql.NVarChar(255), 'egar0@example.com')
            .input('hash', sql.VarChar(255), hash)
            .query("UPDATE Usuarios SET password_hash = @hash WHERE email = @email");
        console.log('Password reset a 123456 para egar0@example.com: OK');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
reset();

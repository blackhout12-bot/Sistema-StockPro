const { connectDB } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function resetAndCheck() {
    const pool = await connectDB();
    const cols = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Usuarios'");
    const colNames = cols.recordset.map(c => c.COLUMN_NAME);
    console.log('COLUMNS:', colNames.join(', '));
    
    const pwdCol = colNames.find(c => c.toLowerCase().includes('password') || c.toLowerCase().includes('contrasena') || c === 'hash');
    console.log('PASSWORD_COLUMN:', pwdCol);
    
    // Get user 1 info
    const res = await pool.query("SELECT id, email, nombre FROM Usuarios WHERE id = 1");
    res.recordset.forEach(u => console.log('USER_1:', JSON.stringify(u)));
    
    // Reset password for user 1 to 'Admin1234!'
    if (pwdCol) {
        const hash = await bcrypt.hash('Admin1234!', 10);
        await pool.query(`UPDATE Usuarios SET ${pwdCol} = '${hash}' WHERE id = 1`);
        console.log('PASSWORD_RESET: OK for user 1 to Admin1234!');
    }
    process.exit(0);
}
resetAndCheck().catch(e => { console.error(e.message); process.exit(1); });

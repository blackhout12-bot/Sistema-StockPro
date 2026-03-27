const bcrypt = require('bcryptjs');
const { connectDB, sql } = require('./src/config/db');

async function reset() {
  const pool = await connectDB();
  const hash = await bcrypt.hash('prueba', 12);
  await pool.request()
    .input('email', sql.NVarChar, 'prueba2@prueba.com')
    .input('hash', sql.VarChar, hash)
    .query("UPDATE Usuarios SET password_hash = @hash WHERE email = @email");
  console.log('Password reset to "prueba" for prueba2@prueba.com');
  process.exit(0);
}
reset();

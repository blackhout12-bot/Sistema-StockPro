const { connectDB } = require('./src/config/db');

async function check() {
    const pool = await connectDB();
    const { recordset } = await pool.request().query("SELECT id, email, mfa_enabled, totp_secret FROM Usuarios WHERE email='admin@gestionmax.com'");
    console.log(recordset[0]);
    process.exit(0);
}
check();

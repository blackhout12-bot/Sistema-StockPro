const { connectDB } = require('./src/config/db');
const speakeasy = require('speakeasy');

async function run() {
    try {
        const pool = await connectDB();
        const secret = speakeasy.generateSecret();
        const totp_secret = secret.base32;

        await pool.request().query(`
            UPDATE Usuarios 
            SET mfa_enabled = 1, totp_secret = '${totp_secret}'
            WHERE email = 'admin@gestionmax.com'
        `);
        console.log('MFA ACTIVADO CON SECRET:', totp_secret);
        require('fs').writeFileSync('totp_admin.txt', totp_secret);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();

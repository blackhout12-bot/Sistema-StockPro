const { sql, connectDB } = require('./src/config/db');
async function run() {
    try {
        const pool = await connectDB();
        await pool.request().query(`
            UPDATE Usuarios 
            SET mfa_enabled = 0 
            WHERE email = 'admin@gestionmax.com'
        `);
        console.log('RESET MFA OK');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();

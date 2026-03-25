const { connectDB } = require('./src/config/db');
async function run() {
    try {
        const pool = await connectDB();
        await pool.request().query("ALTER TABLE Usuarios ADD onboarding_completed BIT DEFAULT 0 NOT NULL");
        console.log('COLUMN ADDED');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();

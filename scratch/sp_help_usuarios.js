const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('--- sp_help Usuarios ---');
        const res = await pool.request().query("EXEC sp_help 'Usuarios'");
        console.log(res.recordsets);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();

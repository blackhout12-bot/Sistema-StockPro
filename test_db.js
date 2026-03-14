require('dotenv').config();
const { connectDB } = require('./src/config/db');

async function checkNonAdmins() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT * FROM Usuarios WHERE rol != 'admin'");
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkNonAdmins();

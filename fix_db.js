require('dotenv').config();
const { connectDB } = require('./src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        await pool.request().query("UPDATE productos SET image_url = null WHERE image_url = 'http://img.com'");
        console.log('Fixed dummy img.com URLs to null');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();

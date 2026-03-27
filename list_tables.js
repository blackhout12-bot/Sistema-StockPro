const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    console.log('Tables:', JSON.stringify(res.recordset.map(t => t.TABLE_NAME), null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();

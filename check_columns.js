const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Productos'");
    console.log(JSON.stringify(res.recordset.map(c => c.COLUMN_NAME), null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();

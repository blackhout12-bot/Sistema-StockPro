const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT * FROM Depositos WHERE empresa_id = 1");
    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();

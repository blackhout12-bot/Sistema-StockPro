const sql = require('mssql');
require('dotenv').config({ path: './.env' });
sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: { encrypt: false, trustServerCertificate: true }
}).then(pool => pool.request().query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES'))
  .then(r => {
      require('fs').writeFileSync('tables_dump.json', JSON.stringify(r.recordset.map(x=>x.TABLE_NAME), null, 2));
      process.exit(0);
  });

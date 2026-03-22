const bcrypt = require('bcryptjs'); 
require('./src/config/db').connectDB().then(async pool => { 
    const hash = await bcrypt.hash('123456', 10); 
    const res = await pool.request().query(`UPDATE Usuarios SET password_hash = '${hash}' WHERE id = (SELECT TOP 1 id FROM Usuarios WHERE rol = 'admin' ORDER BY id ASC)`); 
    console.log('Admin password reset. Affected rows:', res.rowsAffected); 
    const users = await pool.request().query("SELECT TOP 1 email FROM Usuarios WHERE rol = 'admin' ORDER BY id ASC"); 
    console.log('Admin email:', users.recordset[0].email); 
    process.exit(0); 
}).catch(err => { 
    console.error(err); 
    process.exit(1); 
});

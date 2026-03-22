const bcrypt = require('bcryptjs'); 
require('./src/config/db').connectDB().then(async pool => { 
    const hash = await bcrypt.hash('123456', 10); 
    await pool.request().query(`INSERT INTO Usuarios (nombre, email, password_hash, empresa_id, rol) VALUES ('Debug', 'debug@test.com', '${hash}', (SELECT TOP 1 id FROM Empresa), 'admin')`); 
    console.log('User created'); 
    process.exit(0); 
}).catch(err => { 
    console.error(err); 
    process.exit(1); 
});

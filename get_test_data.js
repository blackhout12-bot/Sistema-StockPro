const { connectDB } = require('./src/config/db');
async function getTestData() {
    try {
        const pool = await connectDB();
        
        const empresa = await pool.request().query('SELECT TOP 1 id FROM Empresa');
        const cliente = await pool.request().query('SELECT TOP 1 id FROM Clientes');
        const producto = await pool.request().query('SELECT TOP 1 id, precio, stock FROM Productos WHERE stock > 10');
        const usuario = await pool.request().query('SELECT TOP 1 id FROM Usuarios');
        const sucursal = await pool.request().query('SELECT TOP 1 id FROM Sucurales').catch(() => pool.request().query('SELECT TOP 1 id FROM Sucursales'));
        const deposito = await pool.request().query('SELECT TOP 1 id FROM Depositos');

        console.log(JSON.stringify({
            empresa_id: empresa.recordset[0]?.id,
            cliente_id: cliente.recordset[0]?.id,
            producto: producto.recordset[0],
            usuario_id: usuario.recordset[0]?.id,
            sucursal_id: sucursal.recordset[0]?.id,
            deposito_id: deposito.recordset[0]?.id
        }, null, 2));
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
getTestData();
